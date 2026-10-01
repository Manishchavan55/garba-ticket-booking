import { getDatabasePool, closeDatabasePool } from './connection.js';

const requiredTables = [
  'events',
  'ticket_categories',
  'bookings',
  'payments',
  'qr_tickets',
  'gallery',
  'sponsors',
  'inquiries',
  'admin_users',
];

const requiredForeignKeys = [
  ['ticket_categories', 'fk_ticket_categories_event'],
  ['bookings', 'fk_bookings_ticket_category'],
  ['payments', 'fk_payments_booking'],
  ['qr_tickets', 'fk_qr_tickets_booking'],
];

const requiredUniqueIndexes = [
  ['bookings', 'uq_bookings_booking_id'],
  ['payments', 'uq_payments_idempotency_key'],
  ['payments', 'uq_payments_provider_reference'],
  ['qr_tickets', 'uq_qr_tickets_identifier'],
  ['admin_users', 'uq_admin_users_username'],
  ['admin_users', 'uq_admin_users_email'],
];

const assertRowsExist = (rows, description) => {
  if (rows.length === 0) {
    throw new Error(`Schema validation failed: ${description}`);
  }
};

try {
  const pool = getDatabasePool();
  const databaseName = pool.config.connectionConfig.database;

  const [tables] = await pool.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME IN (?)`,
    [databaseName, requiredTables],
  );

  const actualTables = new Set(tables.map((row) => row.TABLE_NAME));
  const missingTables = requiredTables.filter((table) => !actualTables.has(table));
  if (missingTables.length > 0) {
    throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
  }

  const [foreignKeys] = await pool.query(
    `SELECT TABLE_NAME, CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [databaseName],
  );
  const foreignKeySet = new Set(foreignKeys.map((row) => `${row.TABLE_NAME}:${row.CONSTRAINT_NAME}`));
  const missingForeignKeys = requiredForeignKeys
    .filter(([table, constraint]) => !foreignKeySet.has(`${table}:${constraint}`))
    .map(([table, constraint]) => `${table}.${constraint}`);
  if (missingForeignKeys.length > 0) {
    throw new Error(`Missing required foreign keys: ${missingForeignKeys.join(', ')}`);
  }

  const [indexes] = await pool.query(
    `SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ?
       AND NON_UNIQUE = 0`,
    [databaseName],
  );
  const uniqueIndexSet = new Set(indexes.map((row) => `${row.TABLE_NAME}:${row.INDEX_NAME}`));
  const missingUniqueIndexes = requiredUniqueIndexes
    .filter(([table, index]) => !uniqueIndexSet.has(`${table}:${index}`))
    .map(([table, index]) => `${table}.${index}`);
  if (missingUniqueIndexes.length > 0) {
    throw new Error(`Missing required unique constraints: ${missingUniqueIndexes.join(', ')}`);
  }

  assertRowsExist(tables, 'no application tables were found');
  console.log('Database schema validation succeeded.');
  await closeDatabasePool();
  process.exit(0);
} catch (error) {
  console.error('Database schema validation failed:', error.message);
  await closeDatabasePool();
  process.exit(1);
}
