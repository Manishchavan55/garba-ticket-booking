import 'dotenv/config';

const parsePort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
};

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT, 8080),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  database: Object.freeze({
    host: process.env.DB_HOST ?? 'localhost',
    port: parsePort(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME ?? '',
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
  }),
});
