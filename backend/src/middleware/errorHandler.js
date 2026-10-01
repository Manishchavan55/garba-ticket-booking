import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

const normalizeError = (error) => {
  if (error?.code === 'LIMIT_FILE_SIZE' || error?.type === 'entity.too.large') {
    return { statusCode: 413, code: 'REQUEST_TOO_LARGE', message: 'Request body is too large', type: 'validation' };
  }

  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return { statusCode: 400, code: 'INVALID_JSON', message: 'Malformed JSON request body', type: 'validation' };
  }

  if (error?.code === 'ER_DUP_ENTRY') {
    return { statusCode: 409, code: 'CONFLICT', message: 'The request conflicts with existing data', type: 'conflict' };
  }

  if (typeof error?.statusCode === 'number') {
    return {
      statusCode: error.statusCode,
      code: error.code ?? 'REQUEST_ERROR',
      message: error.message ?? 'Request failed',
      type: error.type ?? 'internal',
    };
  }

  if (error?.code?.startsWith?.('ER_')) {
    return { statusCode: 503, code: 'DATABASE_ERROR', message: 'Database service is unavailable', type: 'database' };
  }

  return { statusCode: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error', type: 'internal' };
};

export const notFoundHandler = (req, res) => {
  sendError(res, {
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  }, 404);
};

export const errorHandler = (error, req, res, _next) => {
  void _next;

  const normalized = normalizeError(error);
  logger.error('API request failed', {
    method: req.method,
    path: req.originalUrl,
    statusCode: normalized.statusCode,
    code: normalized.code,
    type: normalized.type,
  });

  sendError(res, normalized, normalized.statusCode);
};
