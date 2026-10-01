import { validationError } from '../utils/errors.js';

const BOOKING_ID_PATTERN = /^KDN-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_PATTERN = /^[\x20-\x7E]{16,191}$/;

export const validatePaymentBookingId = (req, _res, next) => {
  try {
    if (!BOOKING_ID_PATTERN.test(req.params.bookingId ?? '')) {
      throw validationError('Booking ID is invalid');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requirePaymentIdempotencyKey = (req, _res, next) => {
  try {
    const value = req.get('Idempotency-Key');
    if (!value || !IDEMPOTENCY_PATTERN.test(value)) {
      throw validationError('Idempotency-Key header must contain 16 to 191 printable characters');
    }

    req.paymentIdempotencyKey = value;
    next();
  } catch (error) {
    next(error);
  }
};

export const requirePaymentVerificationPayload = (req, _res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw validationError('Verification payload must be a JSON object');
    }

    if (!BOOKING_ID_PATTERN.test(req.body.bookingId ?? '')) {
      throw validationError('Verification payload must identify a valid booking');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requirePaymentWebhookPayload = (req, _res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw validationError('Webhook payload must be a JSON object');
    }

    next();
  } catch (error) {
    next(error);
  }
};
