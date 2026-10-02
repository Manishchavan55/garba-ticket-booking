import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

let authenticated = false;
const mockCreate = vi.fn();
const mockList = vi.fn();
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../src/services/adminAuth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(async () => (authenticated ? {
    admin: { id: 1, username: 'admin', email: 'admin@example.com' },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  } : null)),
}));

vi.mock('../src/services/inquiry.service.js', () => ({
  createPublicInquiry: mockCreate,
  listAdminInquiries: mockList,
  getAdminInquiry: mockGet,
  updateAdminInquiry: mockUpdate,
  deleteAdminInquiry: mockDelete,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('inquiry APIs', () => {
  beforeEach(() => {
    authenticated = false;
    vi.clearAllMocks();
  });

  it('accepts a valid public inquiry', async () => {
    mockCreate.mockResolvedValueOnce({ submitted: true });
    const response = await request(app).post('/api/inquiries').send({
      name: 'A Person', email: 'person@example.com', phone: '123', message: 'Hello',
    });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, data: { submitted: true } });
  });

  it('rejects missing required fields', async () => {
    const response = await request(app).post('/api/inquiries').send({ name: 'A Person' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects malformed email and oversized name', async () => {
    const response = await request(app).post('/api/inquiries').send({
      name: 'x'.repeat(161), email: 'not-an-email', message: 'Hello',
    });
    expect(response.status).toBe(400);
  });

  it('rejects unauthorized admin access', async () => {
    const response = await request(app).get('/api/admin/inquiries');
    expect(response.status).toBe(401);
  });

  it('allows authenticated admin listing and detail', async () => {
    authenticated = true;
    mockList.mockResolvedValueOnce([{ id: 1, inquiry_status: 'new' }]);
    mockGet.mockResolvedValueOnce({ id: 1, inquiry_status: 'new' });
    const list = await request(app).get('/api/admin/inquiries');
    const detail = await request(app).get('/api/admin/inquiries/1');
    expect(list.status).toBe(200);
    expect(detail.status).toBe(200);
  });

  it('rejects invalid ids and unsupported update fields', async () => {
    authenticated = true;
    expect((await request(app).get('/api/admin/inquiries/nope')).status).toBe(400);
    const response = await request(app).patch('/api/admin/inquiries/1').send({ message: 'change' });
    expect(response.status).toBe(400);
  });

  it('updates an existing schema-supported status', async () => {
    authenticated = true;
    mockUpdate.mockResolvedValueOnce({ id: 1, inquiry_status: 'resolved' });
    const response = await request(app).patch('/api/admin/inquiries/1').send({ inquiryStatus: 'resolved' });
    expect(response.status).toBe(200);
    expect(response.body.data.inquiry_status).toBe('resolved');
  });

  it('rejects unsupported status values', async () => {
    authenticated = true;
    const response = await request(app).patch('/api/admin/inquiries/1').send({ inquiryStatus: 'priority' });
    expect(response.status).toBe(400);
  });

  it('deletes an inquiry', async () => {
    authenticated = true;
    mockDelete.mockResolvedValueOnce(undefined);
    const response = await request(app).delete('/api/admin/inquiries/1');
    expect(response.status).toBe(200);
  });

  it('returns not found from the service', async () => {
    authenticated = true;
    mockGet.mockRejectedValueOnce(Object.assign(new Error('Inquiry not found'), { statusCode: 404, code: 'NOT_FOUND' }));
    const response = await request(app).get('/api/admin/inquiries/999');
    expect(response.status).toBe(404);
  });
});
