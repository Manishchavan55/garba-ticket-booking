import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import { withTransaction } from '../database/transaction.js';

const CONFIRMED_BOOKING_STATUS = 'confirmed';
const SUCCESSFUL_PAYMENT_STATUS = 'successful';
const UNUSED_TICKET_STATUS = 'unused';
const USED_TICKET_STATUS = 'used';
const INVALID_TICKET_STATUS = 'invalid';
const MAX_IDENTIFIER_ATTEMPTS = 5;

const createQrIdentifier = () => randomBytes(32).toString('base64url');

const createDomainError = (statusCode, code, message, type = 'conflict') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.type = type;
  return error;
};

const loadConfirmedBooking = async (connection, bookingDbId) => {
  const [bookingRows] = await connection.execute(`
    SELECT id, booking_id, quantity, booking_status
    FROM bookings
    WHERE id = ?
    LIMIT 1
    FOR UPDATE
  `, [bookingDbId]);

  const booking = bookingRows[0];
  if (!booking) {
    throw createDomainError(404, 'BOOKING_NOT_FOUND', 'Booking was not found', 'not_found');
  }

  if (booking.booking_status !== CONFIRMED_BOOKING_STATUS) {
    throw createDomainError(409, 'BOOKING_NOT_CONFIRMED', 'Booking is not confirmed for ticket issuance');
  }

  const [paymentRows] = await connection.execute(`
    SELECT id, payment_status
    FROM payments
    WHERE booking_id = ?
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `, [booking.id]);

  const payment = paymentRows[0];
  if (!payment || payment.payment_status !== SUCCESSFUL_PAYMENT_STATUS) {
    throw createDomainError(409, 'PAYMENT_NOT_SUCCESSFUL', 'Booking does not have a successful payment');
  }

  return booking;
};

const loadExistingTickets = async (connection, bookingId) => {
  const [rows] = await connection.execute(`
    SELECT id, booking_id, qr_identifier, verification_status, verified_at, used_at, created_at
    FROM qr_tickets
    WHERE booking_id = ?
    ORDER BY id ASC
    FOR UPDATE
  `, [bookingId]);

  return rows;
};

const insertTicket = async (connection, bookingId) => {
  for (let attempt = 0; attempt < MAX_IDENTIFIER_ATTEMPTS; attempt += 1) {
    const qrIdentifier = createQrIdentifier();

    try {
      await connection.execute(`
        INSERT INTO qr_tickets (booking_id, qr_identifier, verification_status)
        VALUES (?, ?, ?)
      `, [bookingId, qrIdentifier, UNUSED_TICKET_STATUS]);

      return qrIdentifier;
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY' && attempt < MAX_IDENTIFIER_ATTEMPTS - 1) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Could not generate a unique QR ticket identifier');
};

const toTicketRecord = (ticket) => ({
  qrIdentifier: ticket.qr_identifier,
  verificationStatus: ticket.verification_status,
  verifiedAt: ticket.verified_at,
  usedAt: ticket.used_at,
  createdAt: ticket.created_at,
});

const issueTicketsInTransaction = async (connection, bookingDbId) => {
  const booking = await loadConfirmedBooking(connection, bookingDbId);
  const existingTickets = await loadExistingTickets(connection, booking.id);

  if (existingTickets.length > booking.quantity) {
    throw createDomainError(409, 'TICKET_QUANTITY_CONFLICT', 'Booking already has more tickets than its persisted quantity');
  }

  const tickets = [...existingTickets];
  const ticketsToCreate = booking.quantity - existingTickets.length;

  for (let index = 0; index < ticketsToCreate; index += 1) {
    const qrIdentifier = await insertTicket(connection, booking.id);
    tickets.push({
      qr_identifier: qrIdentifier,
      verification_status: UNUSED_TICKET_STATUS,
      verified_at: null,
      used_at: null,
      created_at: null,
    });
  }

  return {
    bookingId: booking.booking_id,
    quantity: booking.quantity,
    tickets: tickets.map(toTicketRecord),
  };
};

export const presentTicketData = async (result) => ({
  ...result,
  tickets: await Promise.all(result.tickets.map(async (ticket) => ({
    ...ticket,
    qrImageDataUrl: await QRCode.toDataURL(ticket.qrIdentifier, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
    }),
  }))),
});

export const issueTicketsForConfirmedBooking = async (bookingDbId) => {
  const result = await withTransaction((connection) => issueTicketsInTransaction(connection, bookingDbId));
  return presentTicketData(result);
};

export const issueTicketsForConfirmedBookingInTransaction = (connection, bookingDbId) => (
  issueTicketsInTransaction(connection, bookingDbId)
);

const validateQrIdentifier = (qrIdentifier) => {
  if (typeof qrIdentifier !== 'string' || !/^[A-Za-z0-9_-]{32,191}$/.test(qrIdentifier)) {
    throw createDomainError(400, 'INVALID_QR_IDENTIFIER', 'QR identifier is invalid', 'validation');
  }
};

export const verifyQrTicket = async (qrIdentifier) => {
  validateQrIdentifier(qrIdentifier);

  return withTransaction(async (connection) => {
    const [rows] = await connection.execute(`
      SELECT
        q.id,
        q.booking_id,
        q.qr_identifier,
        q.verification_status,
        b.booking_id AS public_booking_id,
        b.booking_status,
        p.payment_status
      FROM qr_tickets q
      INNER JOIN bookings b ON b.id = q.booking_id
      LEFT JOIN payments p ON p.id = (
        SELECT latest_payment.id
        FROM payments latest_payment
        WHERE latest_payment.booking_id = q.booking_id
        ORDER BY latest_payment.id DESC
        LIMIT 1
      )
      WHERE q.qr_identifier = ?
      LIMIT 1
      FOR UPDATE
    `, [qrIdentifier]);

    const ticket = rows[0];
    if (!ticket) {
      throw createDomainError(404, 'QR_TICKET_NOT_FOUND', 'QR ticket was not found', 'not_found');
    }

    if (ticket.verification_status === USED_TICKET_STATUS) {
      throw createDomainError(409, 'QR_TICKET_ALREADY_USED', 'QR ticket has already been used');
    }

    if (ticket.verification_status === INVALID_TICKET_STATUS) {
      throw createDomainError(409, 'QR_TICKET_INVALID', 'QR ticket is invalid');
    }

    if (ticket.booking_status !== CONFIRMED_BOOKING_STATUS || ticket.payment_status !== SUCCESSFUL_PAYMENT_STATUS) {
      throw createDomainError(409, 'QR_TICKET_NOT_ELIGIBLE', 'QR ticket is not eligible for entry');
    }

    const [updateResult] = await connection.execute(`
      UPDATE qr_tickets
      SET verification_status = ?, verified_at = CURRENT_TIMESTAMP, used_at = CURRENT_TIMESTAMP
      WHERE id = ? AND verification_status = ?
    `, [USED_TICKET_STATUS, ticket.id, UNUSED_TICKET_STATUS]);

    if (updateResult.affectedRows !== 1) {
      throw createDomainError(409, 'QR_TICKET_ALREADY_USED', 'QR ticket has already been used');
    }

    return {
      verified: true,
      status: USED_TICKET_STATUS,
      bookingId: ticket.public_booking_id,
    };
  });
};

export const ticketStatuses = Object.freeze({
  unused: UNUSED_TICKET_STATUS,
  used: USED_TICKET_STATUS,
  invalid: INVALID_TICKET_STATUS,
});
