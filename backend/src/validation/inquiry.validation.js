const ID_PATTERN = /^\d+$/;
const STATUS_VALUES = new Set(['new', 'in_progress', 'resolved', 'closed']);

const validationError = (message, field) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  error.type = 'validation';
  error.field = field;
  return error;
};

const requireText = (value, field, maxLength, label) => {
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
    throw validationError(`${label} is required and must be ${maxLength} characters or fewer`, field);
  }
};

const validateEmail = (value) => {
  if (typeof value !== 'string' || value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw validationError('Email must be a valid email address of 254 characters or fewer', 'email');
  }
};

export const validateInquiryId = (req, _res, next) => {
  const value = req.params.id;
  if (typeof value !== 'string' || !ID_PATTERN.test(value) || Number(value) <= 0) {
    return next(validationError('Inquiry ID must be a positive integer', 'id'));
  }
  return next();
};

export const validateInquiryBody = (req, _res, next) => {
  try {
    const { name, email, phone, message } = req.body ?? {};
    requireText(name, 'name', 160, 'Name');
    validateEmail(email);
    if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.trim().length > 40)) {
      throw validationError('Phone must be 40 characters or fewer', 'phone');
    }
    requireText(message, 'message', 65535, 'Message');
    return next();
  } catch (error) {
    return next(error);
  }
};

export const validateInquiryUpdate = (req, _res, next) => {
  try {
    const body = req.body ?? {};
    const keys = Object.keys(body);
    if (keys.length !== 1 || keys[0] !== 'inquiryStatus') {
      throw validationError('Only inquiryStatus may be updated', 'inquiryStatus');
    }
    if (!STATUS_VALUES.has(body.inquiryStatus)) {
      throw validationError('Inquiry status must be one of: new, in_progress, resolved, closed', 'inquiryStatus');
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
