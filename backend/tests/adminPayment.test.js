import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

let authenticated = false;
const mockListAdminPayments = vi.fn();
const mockGetAdminPayment = vi.fn();

vi.mock('../src/services/adminAuth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(async () => (authenticated ? {
    admin: { id: 1, username: 'admin', email: 'admin@example.com' },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  } : null)),
}));

vi.mock('../src/services/adminPayment.service.js', () => ({
  listAdminPayments: mockListAdminPayments,
  getAdminPayment: mockGetAdminPayment,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('admin payment APIs', () => {
  beforeEach(() => {
    authenticated = false;
    vi.clearAllMocks();
  });

  it('rejects unauthenticated payment requests with 401', async () => {
    const response = await request(app).get('/api/admin/payments');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
    });
  });

  it('allows an authenticated administrator to list transactions', async () => {
    authenticated = true;
    mockListAdminPayments.mockResolvedValueOnce([{ id: 7, provider: 'phonepe', payment_status: 'successful' }]);

    const response = await request(app).get('/api/admin/payments');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [{ id: 7, provider: 'phonepe', payment_status: 'successful' }],
    });
  });

  it('returns payment detail for an authenticated administrator', async () => {
    authenticated = true;
    mockGetAdminPayment.mockResolvedValueOnce({ id: 7, public_booking_id: 'KDN-123' });

    const response = await request(app).get('/api/admin/payments/7');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 7, public_booking_id: 'KDN-123' });
    expect(mockGetAdminPayment).toHaveBeenCalledWith('7');
  });

  it('rejects non-positive or malformed payment IDs before service access', async () => {
    authenticated = true;

    const response = await request(app).get('/api/admin/payments/0');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockGetAdminPayment).not.toHaveBeenCalled();
  });

  it('returns 404 when the requested payment does not exist', async () => {
    authenticated = true;
    mockGetAdminPayment.mockRejectedValueOnce(Object.assign(new Error('Payment not found'), {
      statusCode: 404,
      code: 'NOT_FOUND',
      type: 'not_found',
    }));

    const response = await request(app).get('/api/admin/payments/999');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
