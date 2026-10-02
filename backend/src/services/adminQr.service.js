import { getDatabasePool } from '../database/connection.js';
import { notFoundError } from '../utils/errors.js';

const QR_FIELDS = `
  q.id,
  q.booking_id,
  q.qr_identifier,
  q.verification_status,
  q.verified_at,
  q.used_at,
  q.created_at,
  b.booking_id AS public_booking_id,
  b.customer_name,
  b.customer_email,
  e.name AS event_name,
  tc.name AS ticket_category_name
`;

export const listAdminQrTickets = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${QR_FIELDS}
    FROM qr_tickets q
    INNER JOIN bookings b ON b.id = q.booking_id
    INNER JOIN ticket_categories tc ON tc.id = b.ticket_category_id
    INNER JOIN events e ON e.id = tc.event_id
    ORDER BY q.created_at DESC, q.id DESC
  `);
  return rows;
};

export const getAdminQrTicket = async (ticketId) => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${QR_FIELDS}
    FROM qr_tickets q
    INNER JOIN bookings b ON b.id = q.booking_id
    INNER JOIN ticket_categories tc ON tc.id = b.ticket_category_id
    INNER JOIN events e ON e.id = tc.event_id
    WHERE q.id = ?
    LIMIT 1
  `, [ticketId]);

  if (!rows[0]) throw notFoundError('QR ticket not found');
  return rows[0];
};
