import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('API foundation', () => {
  it('returns a successful health response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'kesariya-api',
    });
  });

  it('returns JSON 404 for an unknown API route', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('Route not found');
  });
});
