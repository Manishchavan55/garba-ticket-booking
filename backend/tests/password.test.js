import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

describe('Admin password hashing', () => {
  it('hashes and verifies passwords without storing plaintext', async () => {
    const password = 'A-secure-development-password';
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toContain(password);
    expect(passwordHash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword('a-different-password', passwordHash)).resolves.toBe(false);
  });

  it('rejects malformed password hashes safely', async () => {
    await expect(verifyPassword('password', 'not-a-password-hash')).resolves.toBe(false);
  });
});
