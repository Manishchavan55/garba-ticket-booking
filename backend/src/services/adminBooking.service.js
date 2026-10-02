import { getDatabasePool } from '../database/connection.js';
import { notFoundError } from '../utils/errors.js';

const BOOKING_FIELDS = `
  b.id,
  b.booking_id,
  b.ticket_category_id,
  tc.name AS ticket_category_name,
  tc.event_id,
  e.name AS event_name,
  b.customer_name,
  b.customer_email,
  b.customer_phone,
  b.quantity,
  b.subtotal_amount,
  b.total_amount,
  b.currency,
  b.booking_status,
  b.created_at,
  b.updated_at
`;

const getBookingOrThrow = async (connection, bookingId) => {
  const [rows] = await connection.execute(`
    SELECT ${BOOKING_FIELDS}
    FROM bookings b
    INNER JOIN ticket_categories tc ON tc.id = b.ticket_category_id
    INNER JOIN events e ON e.id = tc.event_id
    WHERE b.booking_id = ?
    LIMIT 1
  `, [bookingId]);

  if (!rows[0]) throw notFoundError('Booking not found');
  return rows[0];
};

export const listAdminBookings = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${BOOKING_FIELDS}
    FROM bookings b
    INNER JOIN ticket_categories tc ON tc.id = b.ticket_category_id
    INNER JOIN events e ON e.id = tc.event_id
    ORDER BY b.created_at DESC, b.id DESC
  `);
  return rows;
};

export const getAdminBooking = async (bookingId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    return await getBookingOrThrow(connection, bookingId);
  } finally {
    connection.release();
  }
};
