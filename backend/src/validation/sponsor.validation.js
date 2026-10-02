const SPONSOR_ID_PATTERN = /^\d+$/;

const validationError = (message, field) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  error.type = 'validation';
  error.field = field;
  return error;
};

const validateOptionalUrl = (value) => {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateSponsorId = (req, _res, next) => {
  const value = req.params.id;
  if (typeof value !== 'string' || !SPONSOR_ID_PATTERN.test(value) || Number(value) <= 0) {
    return next(validationError('Sponsor ID must be a positive integer', 'id'));
  }
  return next();
};

export const validateSponsorBody = (req, _res, next) => {
  const body = req.body ?? {};
  const { name, logoUrl, inquiryInformation, isActive } = body;

  if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 200) {
    return next(validationError('Sponsor name is required and must be 200 characters or fewer', 'name'));
  }
  if (!validateOptionalUrl(logoUrl)) {
    return next(validationError('Logo URL must be an HTTP or HTTPS URL of 2048 characters or fewer', 'logoUrl'));
  }
  if (inquiryInformation !== undefined && inquiryInformation !== null && typeof inquiryInformation !== 'string') {
    return next(validationError('Inquiry information must be text', 'inquiryInformation'));
  }
  if (typeof isActive !== 'boolean') {
    return next(validationError('isActive must be a boolean', 'isActive'));
  }

  return next();
};
