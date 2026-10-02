import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

let authenticated = false;
const mockListPublicGallery = vi.fn();
const mockListAdminGallery = vi.fn();
const mockGetAdminGallery = vi.fn();
const mockCreateAdminGallery = vi.fn();
const mockUpdateAdminGallery = vi.fn();
const mockDeleteAdminGallery = vi.fn();

vi.mock('../src/services/adminAuth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(async () => (authenticated ? {
    admin: { id: 1, username: 'admin', email: 'admin@example.com' },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  } : null)),
}));

vi.mock('../src/services/gallery.service.js', () => ({
  listPublicGallery: mockListPublicGallery,
  listAdminGallery: mockListAdminGallery,
  getAdminGallery: mockGetAdminGallery,
  createAdminGallery: mockCreateAdminGallery,
  updateAdminGallery: mockUpdateAdminGallery,
  deleteAdminGallery: mockDeleteAdminGallery,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('gallery APIs', () => {
  beforeEach(() => {
    authenticated = false;
    vi.clearAllMocks();
  });

  it('allows the public gallery endpoint without authentication', async () => {
    mockListPublicGallery.mockResolvedValueOnce([{ id: 1, media_type: 'image', is_active: true }]);
    const response = await request(app).get('/api/gallery');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [{ id: 1, media_type: 'image', is_active: true }] });
  });

  it('rejects unauthenticated admin gallery access with 401', async () => {
    const response = await request(app).get('/api/admin/gallery');
    expect(response.status).toBe(401);
  });

  it('allows an authenticated administrator to list gallery items', async () => {
    authenticated = true;
    mockListAdminGallery.mockResolvedValueOnce([{ id: 2, media_type: 'video' }]);
    const response = await request(app).get('/api/admin/gallery');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 2, media_type: 'video' }]);
  });

  it('creates, updates, and deletes gallery items', async () => {
    authenticated = true;
    mockCreateAdminGallery.mockResolvedValueOnce({ id: 3, media_type: 'image', is_active: true });
    mockUpdateAdminGallery.mockResolvedValueOnce({ id: 3, media_type: 'image', is_active: false });
    mockDeleteAdminGallery.mockResolvedValueOnce(undefined);

    const createResponse = await request(app).post('/api/admin/gallery').send({
      title: 'Garba', mediaType: 'image', mediaUrl: 'https://example.com/garba.jpg', altText: 'Garba night', isActive: true,
    });
    expect(createResponse.status).toBe(201);

    const updateResponse = await request(app).patch('/api/admin/gallery/3').send({
      title: 'Garba', mediaType: 'image', mediaUrl: 'https://example.com/garba.jpg', altText: 'Garba night', isActive: false,
    });
    expect(updateResponse.status).toBe(200);

    const deleteResponse = await request(app).delete('/api/admin/gallery/3');
    expect(deleteResponse.status).toBe(200);
  });

  it('rejects invalid IDs before service access', async () => {
    authenticated = true;
    const response = await request(app).get('/api/admin/gallery/0');
    expect(response.status).toBe(400);
    expect(mockGetAdminGallery).not.toHaveBeenCalled();
  });

  it('rejects unsupported media types and invalid URLs', async () => {
    authenticated = true;
    const response = await request(app).post('/api/admin/gallery').send({
      title: 'Bad', mediaType: 'audio', mediaUrl: '', altText: null, isActive: true,
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockCreateAdminGallery).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing admin gallery item', async () => {
    authenticated = true;
    mockGetAdminGallery.mockRejectedValueOnce(Object.assign(new Error('Gallery item not found'), {
      statusCode: 404, code: 'NOT_FOUND', type: 'not_found',
    }));
    const response = await request(app).get('/api/admin/gallery/999');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
