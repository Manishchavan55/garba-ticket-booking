import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const attempts = new Map();

const getKey = (req) => req.ip ?? req.socket.remoteAddress ?? 'unknown';

const getWindowMs = () => config.adminAuth.loginRateLimitWindowMinutes * 60 * 1000;

export const checkAdminLoginRateLimit = (req, _res, next) => {
  const now = Date.now();
  const key = getKey(req);
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + getWindowMs() });
    return next();
  }

  if (current.count >= config.adminAuth.loginRateLimitMaxAttempts) {
    return next(new AppError('Too many login attempts. Try again later.', {
      statusCode: 429,
      code: 'LOGIN_RATE_LIMITED',
      type: 'rate_limit',
    }));
  }

  return next();
};

export const recordAdminLoginFailure = (req) => {
  const now = Date.now();
  const key = getKey(req);
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + getWindowMs() });
    return;
  }

  current.count += 1;
};

export const clearAdminLoginFailures = (req) => {
  attempts.delete(getKey(req));
};

export const resetAdminLoginRateLimitForTests = () => {
  attempts.clear();
};
