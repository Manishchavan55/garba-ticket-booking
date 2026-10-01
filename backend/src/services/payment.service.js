import { withTransaction } from '../database/transaction.js';
import { getPaymentProvider } from '../payments/providerFactory.js';

const PAYABLE_BOOKING_STATUS = 'pending';
const PAID_BOOKING_STATUS = 'confirmed';
const PAYMENT_PENDING = 'pending';
const PAYMENT_SUCCESSFUL = 'successful';
const PAYMENT_FAILED = 'failed';

const moneyEqual = (left, right) => Number(left) === Number(right);

const createPaymentInTransaction = async (connection, bookingId, idempotencyKey) => {
  const [bookingRows] = await connection.execute(`
    SELECT id, booking_id, booking_status, total_amount, currency
    FROM bookings
    WHERE booking_id = ?
    LIMIT 1
    FOR UPDATE
  `, [bookingId]);

  const booking = bookingRows[0];
  if (!booking) {
    const error = new Error('Booking was not found');
    error.statusCode = 404;
    error.code = 'BOOKING_NOT_FOUND';
    throw error;
  }

  if (booking.booking_status === PAID_BOOKING_STATUS) {
    const error = new Error('Booking has already been paid');
    error.statusCode = 409;
    error.code = 'BOOKING_ALREADY_PAID';
    error.type = 'conflict';
    throw error;
  }

  if (booking.booking_status !== PAYABLE_BOOKING_STATUS) {
    const error = new Error('Booking is not payable in its current state');
    error.statusCode = 409;
    error.code = 'BOOKING_NOT_PAYABLE';
    error.type = 'conflict';
    throw error;
  }

  const [idempotentRows] = await connection.execute(`
    SELECT id, booking_id, provider, gateway_transaction_reference, amount, currency, payment_status
    FROM payments
    WHERE idempotency_key = ?
    LIMIT 1
    FOR UPDATE
  `, [idempotencyKey]);

  if (idempotentRows[0]) {
    return { booking, payment: idempotentRows[0], reused: true };
  }

  const [existingRows] = await connection.execute(`
    SELECT id, booking_id, provider, gateway_transaction_reference, amount, currency, payment_status, idempotency_key
    FROM payments
    WHERE booking_id = ?
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `, [booking.id]);

  const existing = existingRows[0];
  if (existing && existing.payment_status === PAYMENT_SUCCESSFUL) {
    const error = new Error('Booking already has a successful payment');
    error.statusCode = 409;
    error.code = 'BOOKING_ALREADY_PAID';
    error.type = 'conflict';
    throw error;
  }

  if (existing && existing.payment_status === PAYMENT_PENDING) {
    return { booking, payment: existing, reused: true };
  }

  const [result] = await connection.execute(`
    INSERT INTO payments (booking_id, provider, amount, currency, payment_status, idempotency_key)
    VALUES (?, NULL, ?, ?, ?, ?)
  `, [booking.id, booking.total_amount, booking.currency, PAYMENT_PENDING, idempotencyKey]);

  return {
    booking,
    payment: {
      id: result.insertId,
      booking_id: booking.id,
      provider: null,
      gateway_transaction_reference: null,
      amount: String(booking.total_amount),
      currency: booking.currency,
      payment_status: PAYMENT_PENDING,
      idempotency_key: idempotencyKey,
    },
    reused: false,
  };
};

export const initiatePayment = async (bookingId, idempotencyKey) => {
  const paymentContext = await withTransaction((connection) => createPaymentInTransaction(connection, bookingId, idempotencyKey));
  const provider = getPaymentProvider();

  if (paymentContext.payment.gateway_transaction_reference) {
    return {
      bookingId: paymentContext.booking.booking_id,
      paymentId: paymentContext.payment.id,
      status: paymentContext.payment.payment_status,
      amount: String(paymentContext.payment.amount),
      currency: paymentContext.payment.currency,
      checkout: null,
      reused: true,
    };
  }

  try {
    const checkout = await provider.createCheckout({
      bookingId: paymentContext.booking.booking_id,
      paymentId: paymentContext.payment.id,
      amount: String(paymentContext.booking.total_amount),
      currency: paymentContext.booking.currency,
    });

    await withTransaction(async (connection) => {
      await connection.execute(`
        UPDATE payments
        SET provider = ?, gateway_transaction_reference = ?
        WHERE id = ? AND payment_status = ?
      `, [provider.name, checkout.providerTransactionReference, paymentContext.payment.id, PAYMENT_PENDING]);
    });

    return {
      bookingId: paymentContext.booking.booking_id,
      paymentId: paymentContext.payment.id,
      status: PAYMENT_PENDING,
      amount: String(paymentContext.booking.total_amount),
      currency: paymentContext.booking.currency,
      checkout,
      reused: paymentContext.reused,
    };
  } catch (error) {
    throw error;
  }
};

const loadPaymentContext = async (connection, bookingId) => {
  const [rows] = await connection.execute(`
    SELECT
      p.id AS payment_id,
      p.booking_id,
      p.provider,
      p.gateway_transaction_reference,
      p.amount AS payment_amount,
      p.currency AS payment_currency,
      p.payment_status,
      b.booking_id AS public_booking_id,
      b.booking_status,
      b.total_amount AS booking_amount,
      b.currency AS booking_currency
    FROM payments p
    INNER JOIN bookings b ON b.id = p.booking_id
    WHERE b.booking_id = ?
    ORDER BY p.id DESC
    LIMIT 1
    FOR UPDATE
  `, [bookingId]);

  const context = rows[0];
  if (!context) {
    const error = new Error('Payment record was not found for this booking');
    error.statusCode = 404;
    error.code = 'PAYMENT_NOT_FOUND';
    throw error;
  }
  return context;
};

const applyVerifiedPayment = async (connection, context, normalizedPayment) => {
  if (!moneyEqual(context.booking_amount, normalizedPayment.amount)) {
    const error = new Error('Verified payment amount does not match the authoritative booking amount');
    error.statusCode = 409;
    error.code = 'PAYMENT_AMOUNT_MISMATCH';
    error.type = 'conflict';
    throw error;
  }

  if (context.booking_currency !== normalizedPayment.currency) {
    const error = new Error('Verified payment currency does not match the authoritative booking currency');
    error.statusCode = 409;
    error.code = 'PAYMENT_CURRENCY_MISMATCH';
    error.type = 'conflict';
    throw error;
  }

  if (!normalizedPayment.providerTransactionReference) {
    const error = new Error('Verified payment did not contain a provider transaction reference');
    error.statusCode = 502;
    error.code = 'PAYMENT_REFERENCE_MISSING';
    error.type = 'internal';
    throw error;
  }

  if (context.payment_status === PAYMENT_SUCCESSFUL || context.booking_status === PAID_BOOKING_STATUS) {
    return { status: PAYMENT_SUCCESSFUL, bookingStatus: PAID_BOOKING_STATUS, idempotent: true };
  }

  if (normalizedPayment.status === PAYMENT_FAILED) {
    await connection.execute(`
      UPDATE payments
      SET payment_status = ?, gateway_transaction_reference = COALESCE(?, gateway_transaction_reference), provider = ?
      WHERE id = ? AND payment_status = ?
    `, [PAYMENT_FAILED, normalizedPayment.providerTransactionReference, normalizedPayment.provider, context.payment_id, PAYMENT_PENDING]);

    return { status: PAYMENT_FAILED, bookingStatus: context.booking_status, idempotent: false };
  }

  if (normalizedPayment.status !== PAYMENT_SUCCESSFUL) {
    const error = new Error('Provider payment status is not a terminal successful or failed state');
    error.statusCode = 409;
    error.code = 'PAYMENT_STATUS_NOT_VERIFIED';
    error.type = 'conflict';
    throw error;
  }

  const [referenceRows] = await connection.execute(`
    SELECT id, booking_id, payment_status
    FROM payments
    WHERE provider = ? AND gateway_transaction_reference = ?
    LIMIT 1
    FOR UPDATE
  `, [normalizedPayment.provider, normalizedPayment.providerTransactionReference]);

  if (referenceRows[0] && referenceRows[0].id !== context.payment_id) {
    const error = new Error('Provider transaction reference is already associated with another payment');
    error.statusCode = 409;
    error.code = 'PAYMENT_REFERENCE_CONFLICT';
    error.type = 'conflict';
    throw error;
  }

  await connection.execute(`
    UPDATE payments
    SET payment_status = ?, gateway_transaction_reference = ?, provider = ?
    WHERE id = ? AND payment_status = ?
  `, [PAYMENT_SUCCESSFUL, normalizedPayment.providerTransactionReference, normalizedPayment.provider, context.payment_id, PAYMENT_PENDING]);

  await connection.execute(`
    UPDATE bookings
    SET booking_status = ?
    WHERE id = ? AND booking_status = ?
  `, [PAID_BOOKING_STATUS, context.booking_id, PAYABLE_BOOKING_STATUS]);

  return { status: PAYMENT_SUCCESSFUL, bookingStatus: PAID_BOOKING_STATUS, idempotent: false };
};

export const verifyPayment = async (bookingId, providerPayload) => {
  const provider = getPaymentProvider();
  const normalized = await provider.verifyPayment(providerPayload);

  return withTransaction(async (connection) => {
    const context = await loadPaymentContext(connection, bookingId);
    return applyVerifiedPayment(connection, context, normalized);
  });
};

export const processWebhook = async (providerPayload) => {
  const provider = getPaymentProvider();
  const normalized = await provider.verifyWebhook(providerPayload);

  if (!normalized.bookingId) {
    const error = new Error('Verified webhook did not identify a booking');
    error.statusCode = 400;
    error.code = 'PAYMENT_BOOKING_REFERENCE_MISSING';
    throw error;
  }

  return withTransaction(async (connection) => {
    const context = await loadPaymentContext(connection, normalized.bookingId);
    return applyVerifiedPayment(connection, context, normalized);
  });
};

export const paymentStates = Object.freeze({
  pending: PAYMENT_PENDING,
  successful: PAYMENT_SUCCESSFUL,
  failed: PAYMENT_FAILED,
});
