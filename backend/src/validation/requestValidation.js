import { validationError } from '../utils/errors.js';

export const validateJsonBody = (req, res, next) => {
  const contentLength = Number(req.headers['content-length'] ?? 0);
  const hasBody = Number.isFinite(contentLength) && contentLength > 0;

  if (req.method !== 'GET' && req.method !== 'HEAD' && hasBody && !req.is('application/json')) {
    return next(validationError('Content-Type must be application/json'));
  }

  next();
};

export const validateBody = (validator) => (req, _res, next) => {
  const result = validator(req.body);
  if (result === true) {
    return next();
  }

  const message = typeof result === 'string' ? result : 'Request validation failed';
  return next(validationError(message));
};
