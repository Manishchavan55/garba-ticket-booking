const fs = require('node:fs/promises');
const path = require('node:path');
const { getPool } = require('./connection');

async function migrate() {
  const pool = getPool();
  const migrationsDir = path.resolve(__dirname, '../../../database/migrations');
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();

  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB`);

    for (const file of files) {
      const [rows] = await connection.query(
        'SELECT id FROM schema_migrations WHERE filename = ? LIMIT 1',
        [file],
      );
      if (rows.length > 0) continue;

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Database migrations completed.');
      return getPool().end();
    })
    .catch((error) => {
      console.error('Database migration failed:', error.message);
      process.exitCode = 1;
    });
}

module.exports = { migrate };
