import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabasePool, closeDatabasePool } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(__dirname, '../../../database/migrations');

const splitSqlStatements = (sql) => sql
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

export const migrate = async () => {
  const pool = getDatabasePool();
  const migrationFiles = (await fs.readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB
  `);

  const [appliedRows] = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => row.filename));

  for (const filename of migrationFiles) {
    if (applied.has(filename)) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDirectory, filename), 'utf8');
    const statements = splitSqlStatements(sql);

    console.log(`Applying migration: ${filename}`);
    for (const statement of statements) {
      await pool.query(statement);
    }

    await pool.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
  }
};

try {
  await migrate();
  console.log('Database migrations completed successfully.');
} catch (error) {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
