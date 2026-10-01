import { getDatabasePool } from '../database/connection.js';

const PUBLIC_EVENT_FIELDS = `
  id,
  name,
  event_date,
  start_time,
  end_time,
  venue,
  guidelines
`;

export const getPublicEvents = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.query(`
    SELECT ${PUBLIC_EVENT_FIELDS}
    FROM events
    ORDER BY event_date ASC, start_time ASC, id ASC
  `);

  return rows;
};

export const getPublicEventById = async (eventId) => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${PUBLIC_EVENT_FIELDS}
    FROM events
    WHERE id = ?
    LIMIT 1
  `, [eventId]);

  return rows[0] ?? null;
};

export const getPublicTicketCategories = async (eventId) => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT name, price, availability_status
    FROM ticket_categories
    WHERE event_id = ?
    ORDER BY id ASC
  `, [eventId]);

  return rows;
};
