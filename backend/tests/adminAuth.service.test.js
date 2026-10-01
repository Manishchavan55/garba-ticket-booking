import { beforeEach, describe, expect, it, vi } from 'vitest';

const { connection, pool } = vi.hoisted(() => ({
  connection: { execute: vi.fn() },
  pool: { execute: vi.fn() },
}));

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: vi.fn(() => pool),
}));

vi.mock('../src/database/transaction.js', () => ({
  withTransaction: vi.fn(async (operation) => operation(connection)),
}));

import {
  getAuthenticatedAdmin,
  loginAdmin,
  logoutAdmin,
} from '../src/services/adminAuth.service.js';
import { hashPassword } from '../src/utils/password.js';

const validPassword = 'A-secure-development-password';

beforeEach(() => {
  connection.execute.mockReset();
  pool.execute.mockReset();
});

describe('Admin authentication service', () => {
  it('creates a session for valid active admin credentials', async () => {
    const passwordHash = await hashPassword(validPassword);
    connection.execute
      .mockResolvedValueOnce([[{
        id: 7,
        username: 'admin',
        email: 'admin@example.com',
        password_hash: passwordHash,
        is_active: 1,
      }], []])
      .mockResolvedValueOnce([{}, []])
      .mockResolvedValueOnce([{}, []]);

    const result = await loginAdmin({ identifier: 'admin', password: validPassword });

    expect(result.admin).toEqual({ id: 7, username: 'admin', email: 'admin@example.com' });
    expect(result.token).toEqual(expect.any(String));
    expect(result.expiresAt).toEqual(expect.any(Date));
    expect(connection.execute).toHaveBeenCalledTimes(3);
    expect(connection.execute.mock.calls[1][0]).toContain('INSERT INTO admin_sessions');
    expect(connection.execute.mock.calls[2][0]).toContain('UPDATE admin_users SET last_login_at');
  });

  it('returns null for an invalid password without revealing account existence', async () => {
    const passwordHash = await hashPassword(validPassword);
    connection.execute.mockResolvedValueOnce([[{
      id: 7,
      username: 'admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      is_active: 1,
    }], []]);

    const result = await loginAdmin({ identifier: 'admin', password: 'wrong-password-value' });

    expect(result).toBeNull();
    expect(connection.execute).toHaveBeenCalledTimes(1);
  });

  it('returns null for a nonexistent admin while still performing password verification', async () => {
    connection.execute.mockResolvedValueOnce([[], []]);

    const result = await loginAdmin({ identifier: 'missing@example.com', password: validPassword });

    expect(result).toBeNull();
    expect(connection.execute).toHaveBeenCalledTimes(1);
  });

  it('returns null for an inactive admin', async () => {
    const passwordHash = await hashPassword(validPassword);
    connection.execute.mockResolvedValueOnce([[{
      id: 7,
      username: 'inactive',
      email: 'inactive@example.com',
      password_hash: passwordHash,
      is_active: 0,
    }], []]);

    const result = await loginAdmin({ identifier: 'inactive', password: validPassword });

    expect(result).toBeNull();
    expect(connection.execute).toHaveBeenCalledTimes(1);
  });

  it('returns only safe admin identity from an active unexpired session', async () => {
    pool.execute.mockResolvedValueOnce([[{
      id: 7,
      username: 'admin',
      email: 'admin@example.com',
      is_active: 1,
      expires_at: new Date(Date.now() + 60_000),
    }], []]);

    const result = await getAuthenticatedAdmin('session-token');

    expect(result.admin).toEqual({ id: 7, username: 'admin', email: 'admin@example.com' });
    expect(result.admin).not.toHaveProperty('password_hash');
    expect(result.admin).not.toHaveProperty('is_active');
  });

  it('rejects an expired or missing session', async () => {
    pool.execute.mockResolvedValueOnce([[], []]);
    await expect(getAuthenticatedAdmin('expired-token')).resolves.toBeNull();
    await expect(getAuthenticatedAdmin(null)).resolves.toBeNull();
  });

  it('revokes the session during logout', async () => {
    connection.execute.mockResolvedValueOnce([{}, []]);

    await logoutAdmin('session-token');

    expect(connection.execute).toHaveBeenCalledTimes(1);
    expect(connection.execute.mock.calls[0][0]).toContain('UPDATE admin_sessions');
    expect(connection.execute.mock.calls[0][0]).toContain('revoked_at = CURRENT_TIMESTAMP');
  });
});
