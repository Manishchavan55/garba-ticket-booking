import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/services/adminAuth.service.js', () => ({
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  getAuthenticatedAdmin: vi.fn(),
}));

import { createApp } from '../src/app.js';
import {
  getAuthenticatedAdmin,
  loginAdmin,
  logoutAdmin,
} from '../src/services/adminAuth.service.js';
import { resetAdminLoginRateLimitForTests } from '../src/middleware/adminRateLimit.js';

const app = createApp();
const origin = 'http://localhost:5173';
const admin = { id: 7, username: 'admin', email: 'admin@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
  resetAdminLoginRateLimitForTests();
});

describe('Admin authentication API', () => {
  it('logs in with valid credentials and sets an HttpOnly session cookie', async () => {
    loginAdmin.mockResolvedValue({
      token: 'opaque-session-token',
      expiresAt: new Date(Date.now() + 60_000),
      admin,
    });

    const response = await request(app)
      .post('/api/admin/auth/login')
      .set('Origin', origin)
      .send({ identifier: 'admin', password: 'A-secure-development-password' })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        admin,
        expiresAt: expect.any(String),
      },
    });
    expect(response.headers['set-cookie'][0]).toMatch(/kdn_admin_session=/);
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
    expect(JSON.stringify(response.body)).not.toMatch(/password_hash|password|session-token/i);
  });

  it('uses a generic authentication error for invalid credentials', async () => {
    loginAdmin.mockResolvedValue(null);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app)
      .post('/api/admin/auth/login')
      .set('Origin', origin)
      .send({ identifier: 'unknown', password: 'A-secure-development-password' })
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('Invalid administrator credentials');
    expect(errorSpy.mock.calls.flat().join(' ')).not.toContain('A-secure-development-password');
    errorSpy.mockRestore();
  });

  it('rejects login without credentials', async () => {
    const response = await request(app)
      .post('/api/admin/auth/login')
      .set('Origin', origin)
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(loginAdmin).not.toHaveBeenCalled();
  });

  it('rejects cross-origin state-changing admin requests', async () => {
    const response = await request(app)
      .post('/api/admin/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({ identifier: 'admin', password: 'A-secure-development-password' })
      .expect(403);

    expect(response.body.error.code).toBe('CSRF_ORIGIN_REJECTED');
    expect(loginAdmin).not.toHaveBeenCalled();
  });

  it('returns the safe authenticated identity from /me', async () => {
    getAuthenticatedAdmin.mockResolvedValue({
      admin,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await request(app)
      .get('/api/admin/auth/me')
      .set('Cookie', 'kdn_admin_session=opaque-session-token')
      .expect(200);

    expect(response.body.data.admin).toEqual(admin);
    expect(response.body.data.admin).not.toHaveProperty('password_hash');
  });

  it('rejects an unauthenticated /me request', async () => {
    getAuthenticatedAdmin.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/admin/auth/me')
      .expect(401);

    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('logs out and clears the session cookie', async () => {
    logoutAdmin.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/admin/auth/logout')
      .set('Origin', origin)
      .set('Cookie', 'kdn_admin_session=opaque-session-token')
      .expect(200);

    expect(response.body).toEqual({ success: true, data: { loggedOut: true } });
    expect(logoutAdmin).toHaveBeenCalledWith('opaque-session-token');
    expect(response.headers['set-cookie'][0]).toMatch(/Max-Age=0/);
  });

  it('rejects an authenticated request after logout invalidates the session', async () => {
    logoutAdmin.mockResolvedValue(undefined);
    getAuthenticatedAdmin.mockResolvedValue(null);

    await request(app)
      .post('/api/admin/auth/logout')
      .set('Origin', origin)
      .set('Cookie', 'kdn_admin_session=opaque-session-token')
      .expect(200);

    await request(app)
      .get('/api/admin/auth/me')
      .set('Cookie', 'kdn_admin_session=opaque-session-token')
      .expect(401);
  });

  it('protects the admin namespace after authentication is absent', async () => {
    getAuthenticatedAdmin.mockResolvedValue(null);

    await request(app)
      .get('/api/admin/auth/me')
      .expect(401);
  });

  it('allows configured-origin credentialed CORS without allowing arbitrary origins', async () => {
    const response = await request(app)
      .options('/api/admin/auth/me')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rate limits repeated invalid login attempts', async () => {
    loginAdmin.mockResolvedValue(null);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app)
        .post('/api/admin/auth/login')
        .set('Origin', origin)
        .send({ identifier: 'admin', password: 'A-secure-development-password' })
        .expect(401);
    }

    const response = await request(app)
      .post('/api/admin/auth/login')
      .set('Origin', origin)
      .send({ identifier: 'admin', password: 'A-secure-development-password' })
      .expect(429);

    expect(response.body.error.code).toBe('LOGIN_RATE_LIMITED');
  });
});
