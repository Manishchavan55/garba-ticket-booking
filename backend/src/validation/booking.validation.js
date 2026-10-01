const createValidationError = (message, details = {}) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  error.type = 'validation';
  error.details = details;
  return error;
};

const requireString = (value, field, maxLength) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw createValidationError(`${field} is required`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw createValidationError(`${field} is too long`);
  }

  return normalized;
};

const isPositiveInteger = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateCreateBooking = (req, _res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw createValidationError('Request body must be a JSON object');
    }

    const { eventId, ticketCategoryId, quantity, customerName, customerEmail, customerPhone } = req.body;

    if (!isPositiveInteger(eventId)) {
      throw createValidationError('Event ID must be a positive integer');
    }

    if (!isPositiveInteger(ticketCategoryId)) {
      throw createValidationError('Ticket category ID must be a positive integer');
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw createValidationError('Quantity must be a positive integer');
    }

    req.body = {
      eventId: Number(eventId),
      ticketCategoryId: Number(ticketCategoryId),
      quantity,
      customerName: requireString(customerName, 'Customer name', 160),
      customerEmail: requireString(customerEmail, 'Customer email', 254).toLowerCase(),
      customerPhone: requireString(customerPhone, 'Customer phone', 40),
    };

    if (!EMAIL_PATTERN.test(req.body.customerEmail)) {
      throw createValidationError('Customer email is invalid');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateIdempotencyKey = (req, _res, next) => {
  try {
    const value = req.get('Idempotency-Key');
    if (!value) {
      throw createValidationError('Idempotency-Key header is required');
    }

    const key = value.trim();
    if (key.length < 16 || key.length > 191) {
      throw createValidationError('Idempotency-Key must be between 16 and 191 characters');
    }

    req.idempotencyKey = key;
    next();
  } catch (error) {
    next(error);
  }
};
