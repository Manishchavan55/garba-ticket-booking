import { validationError } from '../utils/errors.js';

export const validateJsonBody = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.headers['content-length'] && !req.is('application/json')) {
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
