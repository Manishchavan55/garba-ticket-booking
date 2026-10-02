import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

let authenticated = false;
const mockListPublicSponsors = vi.fn();
const mockListAdminSponsors = vi.fn();
const mockGetAdminSponsor = vi.fn();
const mockCreateAdminSponsor = vi.fn();
const mockUpdateAdminSponsor = vi.fn();
const mockDeleteAdminSponsor = vi.fn();

vi.mock('../src/services/adminAuth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(async () => (authenticated ? {
    admin: { id: 1, username: 'admin', email: 'admin@example.com' },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  } : null)),
}));

vi.mock('../src/services/sponsor.service.js', () => ({
  listPublicSponsors: mockListPublicSponsors,
  listAdminSponsors: mockListAdminSponsors,
  getAdminSponsor: mockGetAdminSponsor,
  createAdminSponsor: mockCreateAdminSponsor,
  updateAdminSponsor: mockUpdateAdminSponsor,
  deleteAdminSponsor: mockDeleteAdminSponsor,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('sponsor APIs', () => {
  beforeEach(() => {
    authenticated = false;
    vi.clearAllMocks();
  });

  it('returns only public sponsor fields for the public endpoint', async () => {
    mockListPublicSponsors.mockResolvedValueOnce([{ name: 'Sponsor A', logo_url: 'https://example.com/a.png' }]);
    const response = await request(app).get('/api/sponsors');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [{ name: 'Sponsor A', logo_url: 'https://example.com/a.png' }] });
  });

  it('rejects unauthenticated admin access with 401', async () => {
    const response = await request(app).get('/api/admin/sponsors');
    expect(response.status).toBe(401);
  });

  it('allows authenticated admin access', async () => {
    authenticated = true;
    mockListAdminSponsors.mockResolvedValueOnce([{ id: 2, name: 'Sponsor A', is_active: 1 }]);
    const response = await request(app).get('/api/admin/sponsors');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 2, name: 'Sponsor A', is_active: 1 }]);
  });

  it('creates a sponsor', async () => {
    authenticated = true;
    mockCreateAdminSponsor.mockResolvedValueOnce({ id: 3, name: 'Sponsor B' });
    const response = await request(app)
      .post('/api/admin/sponsors')
      .send({ name: 'Sponsor B', logoUrl: null, inquiryInformation: null, isActive: true });
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ id: 3, name: 'Sponsor B' });
  });

  it('updates and deactivates a sponsor', async () => {
    authenticated = true;
    mockUpdateAdminSponsor.mockResolvedValueOnce({ id: 3, name: 'Sponsor B', is_active: 0 });
    const response = await request(app)
      .patch('/api/admin/sponsors/3')
      .send({ name: 'Sponsor B', logoUrl: null, inquiryInformation: null, isActive: false });
    expect(response.status).toBe(200);
    expect(response.body.data.is_active).toBe(0);
  });

  it('deletes a sponsor', async () => {
    authenticated = true;
    mockDeleteAdminSponsor.mockResolvedValueOnce(undefined);
    const response = await request(app).delete('/api/admin/sponsors/3');
    expect(response.status).toBe(200);
  });

  it('rejects an invalid sponsor ID', async () => {
    authenticated = true;
    const response = await request(app).get('/api/admin/sponsors/not-an-id');
    expect(response.status).toBe(400);
  });

  it('rejects invalid sponsor input', async () => {
    authenticated = true;
    const response = await request(app)
      .post('/api/admin/sponsors')
      .send({ name: '', logoUrl: 'javascript:alert(1)', inquiryInformation: null, isActive: true });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for a missing sponsor', async () => {
    authenticated = true;
    mockGetAdminSponsor.mockRejectedValueOnce(Object.assign(new Error('Sponsor not found'), { statusCode: 404, code: 'NOT_FOUND' }));
    const response = await request(app).get('/api/admin/sponsors/999');
    expect(response.status).toBe(404);
  });
});
