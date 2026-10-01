import 'dotenv/config';

const parsePort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOrigins = (value) => value
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT, 8080),
  corsOrigins: Object.freeze(parseOrigins(process.env.CORS_ORIGIN ?? 'http://localhost:5173')),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT ?? '1mb',
  database: Object.freeze({
    host: process.env.DB_HOST ?? 'localhost',
    port: parsePort(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME ?? '',
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
  }),
  payment: Object.freeze({
    provider: process.env.PAYMENT_PROVIDER ?? 'unconfigured',
  }),
  adminAuth: Object.freeze({
    sessionTtlHours: parsePositiveInteger(process.env.ADMIN_SESSION_TTL_HOURS, 8),
    loginRateLimitMaxAttempts: parsePositiveInteger(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 5),
    loginRateLimitWindowMinutes: parsePositiveInteger(process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MINUTES, 15),
  }),
});
