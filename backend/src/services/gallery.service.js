import { getDatabasePool } from '../database/connection.js';
import { notFoundError } from '../utils/errors.js';

const GALLERY_FIELDS = `
  id,
  title,
  media_type,
  media_url,
  alt_text,
  is_active,
  created_at,
  updated_at
`;

const getGalleryItemOrThrow = async (connection, galleryId) => {
  const [rows] = await connection.execute(`
    SELECT ${GALLERY_FIELDS}
    FROM gallery
    WHERE id = ?
    LIMIT 1
  `, [galleryId]);

  if (!rows[0]) throw notFoundError('Gallery item not found');
  return rows[0];
};

export const listPublicGallery = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${GALLERY_FIELDS}
    FROM gallery
    WHERE is_active = TRUE
    ORDER BY id ASC
  `);
  return rows;
};

export const listAdminGallery = async () => {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(`
    SELECT ${GALLERY_FIELDS}
    FROM gallery
    ORDER BY id ASC
  `);
  return rows;
};

export const getAdminGallery = async (galleryId) => {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();
  try {
    return await getGalleryItemOrThrow(connection, galleryId);
  } finally {
    connection.release();
  }
};

export const createAdminGallery = async ({ title, mediaType, mediaUrl, altText, isActive }) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute(`
    INSERT INTO gallery (title, media_type, media_url, alt_text, is_active)
    VALUES (?, ?, ?, ?, ?)
  `, [title ?? null, mediaType, mediaUrl, altText ?? null, isActive ?? true]);

  return getAdminGallery(result.insertId);
};

export const updateAdminGallery = async (galleryId, { title, mediaType, mediaUrl, altText, isActive }) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute(`
    UPDATE gallery
    SET title = ?, media_type = ?, media_url = ?, alt_text = ?, is_active = ?
    WHERE id = ?
  `, [title ?? null, mediaType, mediaUrl, altText ?? null, isActive, galleryId]);

  if (result.affectedRows === 0) throw notFoundError('Gallery item not found');
  return getAdminGallery(galleryId);
};

export const deleteAdminGallery = async (galleryId) => {
  const pool = getDatabasePool();
  const [result] = await pool.execute('DELETE FROM gallery WHERE id = ?', [galleryId]);
  if (result.affectedRows === 0) throw notFoundError('Gallery item not found');
};
