const BOOKING_ID_PATTERN = /^KDN-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_PATTERN = /^[\x20-\x7E]{16,191}$/;

export const validatePaymentBookingId = (req, _res, next) => {
  if (!BOOKING_ID_PATTERN.test(req.params.bookingId ?? '')) {
    const error = new Error('Booking ID is invalid');
    error.statusCode = 400;
    error.code = 'INVALID_BOOKING_ID';
    error.type = 'validation';
    throw error;
  }
  next();
};

export const requirePaymentIdempotencyKey = (req, _res, next) => {
  const value = req.get('Idempotency-Key');
  if (!value || !IDEMPOTENCY_PATTERN.test(value)) {
    const error = new Error('Idempotency-Key header must contain 16 to 191 printable characters');
    error.statusCode = 400;
    error.code = 'INVALID_IDEMPOTENCY_KEY';
    error.type = 'validation';
    throw error;
  }

  req.paymentIdempotencyKey = value;
  next();
};

export const requirePaymentVerificationPayload = (req, _res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    const error = new Error('Verification payload must be a JSON object');
    error.statusCode = 400;
    error.code = 'INVALID_PAYMENT_VERIFICATION_PAYLOAD';
    error.type = 'validation';
    throw error;
  }
  next();
};
