import { getDatabasePool } from '../database/connection.js';
import { notFoundError } from '../utils/errors.js';

const ADMIN_FIELDS = `
  id,
  name,
  email,
  phone,
  message,
  inquiry_status,
  created_at,
  updated_at
`;

const getInquiryOrThrow = async (connection, inquiryId) => {
  const [rows] = await connection.execute(`
    SELECT ${ADMIN_FIELDS}
    FROM inquiries
    WHERE id = ?
    LIMIT 1
  `, [inquiryId]);
  if (!rows[0]) throw notFoundError('Inquiry not found');
  return rows[0];
};

export const createPublicInquiry = async ({ name, email, phone, message }) => {
  const pool = getDatabasePool();
  await pool.execute(`
    INSERT INTO inquiries (name, email, phone, message)
    VALUES (?, ?, ?, ?)
  `, [name.trim(), email.trim(), phone?.trim() || null, message.trim()]);
  return { submitted: true };
};

export const listAdminInquiries = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`SELECT ${ADMIN_FIELDS} FROM inquiries ORDER BY created_at DESC, id DESC`);
  return rows;
};

export const getAdminInquiry = async (inquiryId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    return await getInquiryOrThrow(connection, inquiryId);
  } finally {
    connection.release();
  }
};

export const updateAdminInquiry = async (inquiryId, { inquiryStatus }) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute(
    'UPDATE inquiries SET inquiry_status = ? WHERE id = ?',
    [inquiryStatus, inquiryId],
  );
  if (result.affectedRows === 0) throw notFoundError('Inquiry not found');
  return getAdminInquiry(inquiryId);
};

export const deleteAdminInquiry = async (inquiryId) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute('DELETE FROM inquiries WHERE id = ?', [inquiryId]);
  if (result.affectedRows === 0) throw notFoundError('Inquiry not found');
};
