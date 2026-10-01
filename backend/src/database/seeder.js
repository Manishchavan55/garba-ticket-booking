const fs = require('node:fs/promises');
const path = require('node:path');
const { getPool } = require('./connection');

async function seed() {
  const pool = getPool();
  const seedPath = path.resolve(__dirname, '../../../database/seed/001_development_seed.sql');
  const sql = await fs.readFile(seedPath, 'utf8');
  await pool.query(sql);
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Development seed completed.');
      return getPool().end();
    })
    .catch((error) => {
      console.error('Database seed failed:', error.message);
      process.exitCode = 1;
    });
}

module.exports = { seed };
