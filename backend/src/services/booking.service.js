import { randomUUID } from 'node:crypto';
import { withTransaction } from '../database/transaction.js';

const BOOKING_STATUS = 'pending';
const CURRENCY = 'INR';
const MAX_BOOKING_ID_ATTEMPTS = 3;

const isDuplicateBookingId = (error) => error?.code === 'ER_DUP_ENTRY' && error?.sqlMessage?.includes('uq_bookings_booking_id');

const moneyToCents = (value) => {
  const text = String(value);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) {
    throw new Error('Invalid monetary value returned by database');
  }

  return (BigInt(match[1]) * 100n) + BigInt((match[2] ?? '').padEnd(2, '0') || '0');
};

const centsToMoney = (cents) => {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, '0');
  return `${whole}.${fraction}`;
};

const buildBookingId = () => `KDN-${randomUUID()}`;

const getExistingBooking = async (connection, idempotencyKey) => {
  const [rows] = await connection.execute(`
    SELECT booking_id, booking_status, total_amount, currency
    FROM bookings
    WHERE idempotency_key = ?
    LIMIT 1
  `, [idempotencyKey]);

  return rows[0] ?? null;
};

const createBookingInTransaction = async (connection, input, idempotencyKey) => {
  const existing = await getExistingBooking(connection, idempotencyKey);
  if (existing) {
    return {
      bookingId: existing.booking_id,
      status: existing.booking_status,
      amount: String(existing.total_amount),
      currency: existing.currency,
      reused: true,
    };
  }

  const [categoryRows] = await connection.execute(`
    SELECT id, event_id, price, availability_status
    FROM ticket_categories
    WHERE id = ?
    LIMIT 1
    FOR UPDATE
  `, [input.ticketCategoryId]);

  const category = categoryRows[0];
  if (!category) {
    const error = new Error('Ticket category not found');
    error.statusCode = 404;
    error.code = 'TICKET_CATEGORY_NOT_FOUND';
    throw error;
  }

  if (category.availability_status !== 'available') {
    const error = new Error('Ticket category is not available for booking');
    error.statusCode = 409;
    error.code = 'TICKET_CATEGORY_UNAVAILABLE';
    error.type = 'conflict';
    throw error;
  }

  const unitPriceCents = moneyToCents(category.price);
  const totalCents = unitPriceCents * BigInt(input.quantity);
  const totalAmount = centsToMoney(totalCents);

  for (let attempt = 0; attempt < MAX_BOOKING_ID_ATTEMPTS; attempt += 1) {
    const bookingId = buildBookingId();

    try {
      await connection.execute(`
        INSERT INTO bookings (
          booking_id,
          ticket_category_id,
          customer_name,
          customer_email,
          customer_phone,
          quantity,
          subtotal_amount,
          total_amount,
          currency,
          booking_status,
          idempotency_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookingId,
        category.id,
        input.customerName,
        input.customerEmail,
        input.customerPhone,
        input.quantity,
        totalAmount,
        totalAmount,
        CURRENCY,
        BOOKING_STATUS,
        idempotencyKey,
      ]);

      return {
        bookingId,
        status: BOOKING_STATUS,
        amount: totalAmount,
        currency: CURRENCY,
        reused: false,
      };
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY') {
        const reused = await getExistingBooking(connection, idempotencyKey);
        if (reused) {
          return {
            bookingId: reused.booking_id,
            status: reused.booking_status,
            amount: String(reused.total_amount),
            currency: reused.currency,
            reused: true,
          };
        }

        if (isDuplicateBookingId(error) && attempt < MAX_BOOKING_ID_ATTEMPTS - 1) {
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Could not generate a unique booking ID');
};

export const createBooking = async (input, idempotencyKey) => (
  withTransaction((connection) => createBookingInTransaction(connection, input, idempotencyKey))
);
