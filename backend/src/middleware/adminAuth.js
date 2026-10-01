import { getAuthenticatedAdmin } from '../services/adminAuth.service.js';
import { getSessionToken } from '../utils/adminSession.js';
import { AppError } from '../utils/errors.js';

export const authenticateAdmin = async (req, _res, next) => {
  try {
    const sessionToken = getSessionToken(req);
    const authenticated = await getAuthenticatedAdmin(sessionToken);

    if (!authenticated) {
      return next(new AppError('Authentication required', {
        statusCode: 401,
        code: 'AUTHENTICATION_REQUIRED',
        type: 'authentication',
      }));
    }

    req.admin = authenticated.admin;
    req.adminSessionExpiresAt = authenticated.expiresAt;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireAdmin = (req, _res, next) => {
  if (!req.admin) {
    return next(new AppError('Administrator access required', {
      statusCode: 403,
      code: 'ADMIN_ACCESS_REQUIRED',
      type: 'forbidden',
    }));
  }

  return next();
};
