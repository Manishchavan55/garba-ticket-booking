import { getDatabasePool } from '../database/connection.js';

export const getHealthStatus = () => ({
  status: 'ok',
  service: 'kesariya-api',
});

export const getReadinessStatus = async () => {
  const pool = getDatabasePool();
  await pool.query('SELECT 1');

  return {
    status: 'ready',
    service: 'kesariya-api',
    dependencies: {
      mysql: 'ok',
    },
  };
};
