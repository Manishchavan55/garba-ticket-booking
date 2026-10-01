import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabasePool, closeDatabasePool } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, '../../../database/seed/001_development_seed.sql');

export const seed = async () => {
  const pool = getDatabasePool();
  const sql = await fs.readFile(seedPath, 'utf8');
  await pool.query(sql);
};

try {
  await seed();
  console.log('Development seed completed.');
} catch (error) {
  console.error('Database seed failed:', error.message);
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
