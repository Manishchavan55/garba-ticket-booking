export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_SERVER_ERROR', type = 'internal' } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.type = type;
  }
}

export const validationError = (message = 'Request validation failed') => new AppError(message, {
  statusCode: 400,
  code: 'VALIDATION_ERROR',
  type: 'validation',
});

export const notFoundError = (message = 'Resource not found') => new AppError(message, {
  statusCode: 404,
  code: 'NOT_FOUND',
  type: 'not_found',
});

export const conflictError = (message = 'Resource conflict') => new AppError(message, {
  statusCode: 409,
  code: 'CONFLICT',
  type: 'conflict',
});
