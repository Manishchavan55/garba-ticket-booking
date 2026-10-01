import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const requireSameOrigin = (req, _res, next) => {
  const origin = req.get('origin');
  if (!origin || !config.corsOrigins.includes(origin)) {
    return next(new AppError('Request origin is not allowed', {
      statusCode: 403,
      code: 'CSRF_ORIGIN_REJECTED',
      type: 'forbidden',
    }));
  }

  return next();
};
