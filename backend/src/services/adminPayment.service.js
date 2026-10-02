import { getDatabasePool } from '../database/connection.js';
import { notFoundError } from '../utils/errors.js';

const PAYMENT_FIELDS = `
  p.id,
  p.booking_id,
  b.booking_id AS public_booking_id,
  b.customer_name,
  b.customer_email,
  tc.name AS ticket_category_name,
  e.name AS event_name,
  p.provider,
  p.gateway_transaction_reference,
  p.amount,
  p.currency,
  p.payment_status,
  p.idempotency_key,
  p.created_at,
  p.updated_at
`;

const getPaymentOrThrow = async (connection, paymentId) => {
  const [rows] = await connection.execute(`
    SELECT ${PAYMENT_FIELDS}
    FROM payments p
    INNER JOIN bookings b ON b.id = p.booking_id
    INNER JOIN ticket_categories tc ON tc.id = b.ticket_category_id
    INNER JOIN events e ON e.id = tc.event_id
    WHERE p.id = ?
    LIMIT 1
  `, [paymentId]);

  if (!rows[0]) throw notFoundError('Payment not found');
  return rows[0];
};

export const listAdminPayments = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${PAYMENT_FIELDS}
    FROM payments p
    INNER JOIN bookings b ON b.id = p.booking_id
    INNER JOIN ticket_categories tc ON tc.id = b.ticket_category_id
    INNER JOIN events e ON e.id = tc.event_id
    ORDER BY p.created_at DESC, p.id DESC
  `);
  return rows;
};

export const getAdminPayment = async (paymentId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    return await getPaymentOrThrow(connection, paymentId);
  } finally {
    connection.release();
  }
};
