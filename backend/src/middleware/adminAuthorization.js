import { AppError } from '../utils/errors.js';

export const authorizeAdmin = (policy = () => true) => (req, _res, next) => {
  if (!req.admin) {
    return next(new AppError('Administrator access required', {
      statusCode: 403,
      code: 'ADMIN_ACCESS_REQUIRED',
      type: 'forbidden',
    }));
  }

  if (!policy(req.admin)) {
    return next(new AppError('Administrator is not authorized for this action', {
      statusCode: 403,
      code: 'FORBIDDEN',
      type: 'forbidden',
    }));
  }

  return next();
};
