import { getDatabasePool, closeDatabasePool } from './connection.js';

try {
  const pool = getDatabasePool();
  await pool.query('SELECT 1');
  console.log('MySQL connection check succeeded.');
  await closeDatabasePool();
  process.exit(0);
} catch (error) {
  console.error('MySQL connection check failed:', error.message);
  await closeDatabasePool();
  process.exit(1);
}
