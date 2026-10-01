import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { withTransaction } from '../src/database/transaction.js';

const app = createApp();

describe('API foundation', () => {
  it('returns a consistent successful health response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        service: 'kesariya-api',
      },
    });
  });

  it('returns JSON 404 for an unknown API route', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found: GET /api/does-not-exist',
      },
    });
  });

  it('returns a structured error for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{invalid');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON request body',
      },
    });
  });

  it('returns a structured error for an unsupported request content type', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'text/plain')
      .send('not-json');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Content-Type must be application/json',
      },
    });
  });
});

describe('Transaction helper', () => {
  it('commits successful work and releases the connection', async () => {
    const calls = [];
    const connection = {
      beginTransaction: async () => calls.push('begin'),
      commit: async () => calls.push('commit'),
      rollback: async () => calls.push('rollback'),
      release: () => calls.push('release'),
    };
    const pool = { getConnection: async () => connection };

    await expect(withTransaction(async () => 'done', pool)).resolves.toBe('done');
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
      throw new Error('transaction failed');
    }, pool)).rejects.toThrow('transaction failed');
    expect(calls).toEqual(['begin', 'rollback', 'release']);
  });
});
