import { config } from '../config/env.js';
import { getDatabasePool } from '../database/connection.js';
import { withTransaction } from '../database/transaction.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createSessionToken, hashSessionToken } from '../utils/adminSession.js';
import { AppError } from '../utils/errors.js';

const DUMMY_PASSWORD_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$HoI9AdHDBAJOrZH2petF6ja67mWaYCPuGUooJIIpJOh3JjgGWnZiFZXr7lgCtP8IGWZolm1ugcmnFg4XwqTvHw';

const safeAdmin = (admin) => ({
  id: admin.id,
  username: admin.username,
  email: admin.email,
});

const getSessionExpiry = () => new Date(Date.now() + config.adminAuth.sessionTtlHours * 60 * 60 * 1000);

export const loginAdmin = async ({ identifier, password }) => withTransaction(async (connection) => {
  const [rows] = await connection.execute(
    `SELECT id, username, email, password_hash, is_active
     FROM admin_users
     WHERE username = ? OR email = ?
     LIMIT 1`,
    [identifier, identifier],
  );

  const admin = rows[0] ?? null;
  const passwordHash = admin?.password_hash ?? DUMMY_PASSWORD_HASH;
  const passwordValid = await verifyPassword(password, passwordHash);

  if (!admin || !passwordValid || !admin.is_active) {
    return null;
  }

  const sessionToken = createSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAt = getSessionExpiry();

  await connection.execute(
    'INSERT INTO admin_sessions (admin_user_id, session_token_hash, expires_at) VALUES (?, ?, ?)',
    [admin.id, sessionTokenHash, expiresAt],
  );

  await connection.execute(
    'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
    [admin.id],
  );

  return {
    token: sessionToken,
    expiresAt,
    admin: safeAdmin(admin),
  };
}, getDatabasePool());

export const getAuthenticatedAdmin = async (sessionToken) => {
  if (!sessionToken) {
    return null;
  }

  const [rows] = await getDatabasePool().execute(
    `SELECT au.id, au.username, au.email, au.is_active, s.expires_at
     FROM admin_sessions s
     INNER JOIN admin_users au ON au.id = s.admin_user_id
     WHERE s.session_token_hash = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [hashSessionToken(sessionToken)],
  );

  const admin = rows[0] ?? null;
  if (!admin || !admin.is_active) {
    return null;
  }

  return {
    admin: safeAdmin(admin),
    expiresAt: admin.expires_at,
  };
};

export const logoutAdmin = async (sessionToken) => {
  if (!sessionToken) {
    return;
  }

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE admin_sessions
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE session_token_hash = ? AND revoked_at IS NULL`,
      [hashSessionToken(sessionToken)],
    );
  }, getDatabasePool());
};

export const createDevelopmentAdmin = async ({ username, email, password }) => {
  if (config.nodeEnv === 'production' && process.env.ADMIN_BOOTSTRAP_CONFIRM !== 'CREATE_ADMIN') {
    throw new AppError('Production admin creation requires explicit confirmation', {
      statusCode: 403,
      code: 'ADMIN_BOOTSTRAP_NOT_CONFIRMED',
      type: 'forbidden',
    });
  }

  const passwordHash = await hashPassword(password);
  const pool = getDatabasePool();
  await pool.execute(
    `INSERT INTO admin_users (username, email, password_hash, is_active)
     VALUES (?, ?, ?, TRUE)`,
    [username, email, passwordHash],
  );
};
