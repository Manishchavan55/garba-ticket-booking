import { getDatabasePool } from '../database/connection.js';
import { conflictError, notFoundError } from '../utils/errors.js';

const EVENT_FIELDS = `id, name, event_date, start_time, end_time, venue, guidelines, created_at, updated_at`;
const CATEGORY_FIELDS = `id, event_id, name, price, availability_status, created_at, updated_at`;

const mapDuplicateError = (error) => {
  if (error?.code === 'ER_DUP_ENTRY') {
    return conflictError('A ticket category with this name already exists for the event');
  }
  return error;
};

const getEventOrThrow = async (connection, eventId) => {
  const [rows] = await connection.execute(`SELECT ${EVENT_FIELDS} FROM events WHERE id = ? LIMIT 1`, [eventId]);
  if (!rows[0]) throw notFoundError('Event not found');
  return rows[0];
};

const getCategoryOrThrow = async (connection, categoryId) => {
  const [rows] = await connection.execute(`SELECT ${CATEGORY_FIELDS} FROM ticket_categories WHERE id = ? LIMIT 1`, [categoryId]);
  if (!rows[0]) throw notFoundError('Ticket category not found');
  return rows[0];
};

export const listAdminEvents = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${EVENT_FIELDS}
    FROM events
    ORDER BY event_date ASC, start_time ASC, id ASC
  `);
  return rows;
};

export const getAdminEvent = async (eventId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    return await getEventOrThrow(connection, eventId);
  } finally {
    connection.release();
  }
};

export const createAdminEvent = async (data) => {
  const pool = getDatabasePool();
  try {
    const [result] = await pool.execute(`
      INSERT INTO events (name, event_date, start_time, end_time, venue, guidelines)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.name.trim(), data.event_date, data.start_time, data.end_time ?? null, data.venue.trim(), data.guidelines ?? null]);
    return getAdminEvent(result.insertId);
  } catch (error) {
    throw mapDuplicateError(error);
  }
};

export const updateAdminEvent = async (eventId, data) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    await getEventOrThrow(connection, eventId);
    const fields = [];
    const values = [];
    const mapping = {
      name: (value) => value.trim(),
      event_date: (value) => value,
      start_time: (value) => value,
      end_time: (value) => value ?? null,
      venue: (value) => value.trim(),
      guidelines: (value) => value ?? null,
    };
    for (const [field, transform] of Object.entries(mapping)) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        fields.push(`${field} = ?`);
        values.push(transform(data[field]));
      }
    }
    if (fields.length === 0) return getEventOrThrow(connection, eventId);
    values.push(eventId);
    await connection.execute(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values);
    return getEventOrThrow(connection, eventId);
  } finally {
    connection.release();
  }
};

export const deleteAdminEvent = async (eventId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    await getEventOrThrow(connection, eventId);
    const [categories] = await connection.execute(
      'SELECT COUNT(*) AS count FROM ticket_categories WHERE event_id = ?',
      [eventId],
    );
    if (Number(categories[0]?.count ?? 0) > 0) {
      throw conflictError('Event cannot be deleted while ticket categories exist');
    }
    await connection.execute('DELETE FROM events WHERE id = ?', [eventId]);
  } finally {
    connection.release();
  }
};

export const listAdminTicketCategories = async (eventId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    await getEventOrThrow(connection, eventId);
    const [rows] = await connection.execute(`
      SELECT ${CATEGORY_FIELDS}
      FROM ticket_categories
      WHERE event_id = ?
      ORDER BY id ASC
    `, [eventId]);
    return rows;
  } finally {
    connection.release();
  }
};

export const createAdminTicketCategory = async (eventId, data) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    await getEventOrThrow(connection, eventId);
    try {
      const [result] = await connection.execute(`
        INSERT INTO ticket_categories (event_id, name, price, availability_status)
        VALUES (?, ?, ?, ?)
      `, [eventId, data.name.trim(), data.price, data.availability_status]);
      return getCategoryOrThrow(connection, result.insertId);
    } catch (error) {
      throw mapDuplicateError(error);
    }
  } finally {
    connection.release();
  }
};

export const updateAdminTicketCategory = async (categoryId, data) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    const category = await getCategoryOrThrow(connection, categoryId);
    const fields = [];
    const values = [];
    if (Object.prototype.hasOwnProperty.call(data, 'name')) {
      fields.push('name = ?');
      values.push(data.name.trim());
    }
    if (Object.prototype.hasOwnProperty.call(data, 'price')) {
      fields.push('price = ?');
      values.push(data.price);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'availability_status')) {
      fields.push('availability_status = ?');
      values.push(data.availability_status);
    }
    if (fields.length === 0) return category;
    values.push(categoryId);
    try {
      await connection.execute(`UPDATE ticket_categories SET ${fields.join(', ')} WHERE id = ?`, values);
    } catch (error) {
      throw mapDuplicateError(error);
    }
    return getCategoryOrThrow(connection, categoryId);
  } finally {
    connection.release();
  }
};

export const deleteAdminTicketCategory = async (categoryId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    await getCategoryOrThrow(connection, categoryId);
    const [bookings] = await connection.execute(
      'SELECT COUNT(*) AS count FROM bookings WHERE ticket_category_id = ?',
      [categoryId],
    );
    if (Number(bookings[0]?.count ?? 0) > 0) {
      throw conflictError('Ticket category cannot be deleted because booking history exists');
    }
    await connection.execute('DELETE FROM ticket_categories WHERE id = ?', [categoryId]);
  } finally {
    connection.release();
  }
};
