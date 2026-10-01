import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabasePool, closeDatabasePool } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.join(__dirname, 'migrations');

const splitSqlStatements = (sql) => sql
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

const ensureMigrationTable = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB
  `);
};

const getMigrationFiles = async () => {
  const entries = await fs.readdir(migrationsDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();
};

try {
  const pool = getDatabasePool();
  await ensureMigrationTable(pool);

  const [appliedRows] = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(appliedRows.map((row) => row.filename));
  const migrationFiles = await getMigrationFiles();

  for (const filename of migrationFiles) {
    if (applied.has(filename)) {
      continue;
    }

    const filePath = path.join(migrationsDirectory, filename);
    const sql = await fs.readFile(filePath, 'utf8');
    const statements = splitSqlStatements(sql);

    console.log(`Applying migration: ${filename}`);
    for (const statement of statements) {
      await pool.query(statement);
    }

    await pool.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
  }

  console.log('Database migrations completed successfully.');
  await closeDatabasePool();
  process.exit(0);
} catch (error) {
  console.error('Database migration failed:', error.message);
  await closeDatabasePool();
  process.exit(1);
}
