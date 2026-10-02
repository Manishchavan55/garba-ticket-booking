import { getDatabasePool } from '../database/connection.js';
import { notFoundError } from '../utils/errors.js';

const ADMIN_FIELDS = `
  id,
  name,
  logo_url,
  inquiry_information,
  is_active,
  created_at,
  updated_at
`;

const PUBLIC_FIELDS = `
  name,
  logo_url
`;

const getSponsorOrThrow = async (connection, sponsorId) => {
  const [rows] = await connection.execute(`
    SELECT ${ADMIN_FIELDS}
    FROM sponsors
    WHERE id = ?
    LIMIT 1
  `, [sponsorId]);

  if (!rows[0]) throw notFoundError('Sponsor not found');
  return rows[0];
};

export const listPublicSponsors = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${PUBLIC_FIELDS}
    FROM sponsors
    WHERE is_active = TRUE
    ORDER BY id ASC
  `);
  return rows;
};

export const listAdminSponsors = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${ADMIN_FIELDS}
    FROM sponsors
    ORDER BY id ASC
  `);
  return rows;
};

export const getAdminSponsor = async (sponsorId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    return await getSponsorOrThrow(connection, sponsorId);
  } finally {
    connection.release();
  }
};

export const createAdminSponsor = async ({ name, logoUrl, inquiryInformation, isActive }) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute(`
    INSERT INTO sponsors (name, logo_url, inquiry_information, is_active)
    VALUES (?, ?, ?, ?)
  `, [name.trim(), logoUrl ?? null, inquiryInformation ?? null, isActive ?? true]);

  return getAdminSponsor(result.insertId);
};

export const updateAdminSponsor = async (sponsorId, { name, logoUrl, inquiryInformation, isActive }) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute(`
    UPDATE sponsors
    SET name = ?, logo_url = ?, inquiry_information = ?, is_active = ?
    WHERE id = ?
  `, [name.trim(), logoUrl ?? null, inquiryInformation ?? null, isActive, sponsorId]);

  if (result.affectedRows === 0) throw notFoundError('Sponsor not found');
  return getAdminSponsor(sponsorId);
};

export const deleteAdminSponsor = async (sponsorId) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute('DELETE FROM sponsors WHERE id = ?', [sponsorId]);
  if (result.affectedRows === 0) throw notFoundError('Sponsor not found');
};
