import { config } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { loginAdmin, logoutAdmin } from '../services/adminAuth.service.js';
import { clearSessionCookie, getSessionToken, setSessionCookie } from '../utils/adminSession.js';
import { clearAdminLoginFailures, recordAdminLoginFailure } from '../middleware/adminRateLimit.js';

const invalidCredentialsError = () => new AppError('Invalid administrator credentials', {
  statusCode: 401,
  code: 'INVALID_CREDENTIALS',
  type: 'authentication',
});

const isSecureCookie = () => config.nodeEnv === 'production';

export const login = async (req, res, next) => {
  try {
    const result = await loginAdmin(req.body);

    if (!result) {
      recordAdminLoginFailure(req);
      logger.error('Admin login failed', { ip: req.ip });
      return next(invalidCredentialsError());
    }

    clearAdminLoginFailures(req);
    setSessionCookie(res, result.token, {
      secure: isSecureCookie(),
      maxAgeSeconds: config.adminAuth.sessionTtlHours * 60 * 60,
    });

    logger.info('Admin login succeeded', {
      adminId: result.admin.id,
      username: result.admin.username,
      ip: req.ip,
    });

    return sendSuccess(res, {
      admin: result.admin,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return next(error);
  }
};

export const me = (req, res) => sendSuccess(res, {
  admin: req.admin,
  expiresAt: req.adminSessionExpiresAt,
});

export const logout = async (req, res, next) => {
  try {
    const sessionToken = getSessionToken(req);
    await logoutAdmin(sessionToken);
    clearSessionCookie(res, { secure: isSecureCookie() });

    logger.info('Admin logout', {
      adminId: req.admin?.id,
      username: req.admin?.username,
      ip: req.ip,
    });

    return sendSuccess(res, { loggedOut: true });
  } catch (error) {
    return next(error);
  }
};
