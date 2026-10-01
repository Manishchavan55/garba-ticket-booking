import { describe, expect, it } from 'vitest';
import { withTransaction } from '../src/database/transaction.js';

describe('Database transaction helper', () => {
  it('commits successful work and releases the connection', async () => {
    const calls = [];
    const connection = {
      beginTransaction: async () => calls.push('begin'),
      commit: async () => calls.push('commit'),
      rollback: async () => calls.push('rollback'),
      release: () => calls.push('release'),
    };
    const pool = { getConnection: async () => connection };

    const result = await withTransaction(async () => 'ok', pool);

    expect(result).toBe('ok');
    expect(calls).toEqual(['begin', 'commit', 'release']);
  });

  it('rolls back failed work and releases the connection', async () => {
    const calls = [];
    const connection = {
      beginTransaction: async () => calls.push('begin'),
      commit: async () => calls.push('commit'),
      rollback: async () => calls.push('rollback'),
      release: () => calls.push('release'),
    };
    const pool = { getConnection: async () => connection };

    await expect(withTransaction(async () => {
      throw new Error('booking failure');
    }, pool)).rejects.toThrow('booking failure');

    expect(calls).toEqual(['begin', 'rollback', 'release']);
  });
});
