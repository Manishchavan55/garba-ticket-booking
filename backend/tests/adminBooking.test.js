import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

let authenticated = false;
const mockListAdminBookings = vi.fn();
const mockGetAdminBooking = vi.fn();

vi.mock('../src/services/adminAuth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(async () => (authenticated ? {
    admin: { id: 1, username: 'admin', email: 'admin@example.com' },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  } : null)),
}));

vi.mock('../src/services/adminBooking.service.js', () => ({
  listAdminBookings: mockListAdminBookings,
  getAdminBooking: mockGetAdminBooking,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('admin booking APIs', () => {
  beforeEach(() => {
    authenticated = false;
    vi.clearAllMocks();
  });

  it('rejects unauthenticated booking requests with 401', async () => {
    const response = await request(app).get('/api/admin/bookings');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
    });
  });

  it('allows an authenticated administrator to list bookings', async () => {
    authenticated = true;
    mockListAdminBookings.mockResolvedValueOnce([{ booking_id: 'KDN-123', booking_status: 'pending' }]);

    const response = await request(app).get('/api/admin/bookings');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [{ booking_id: 'KDN-123', booking_status: 'pending' }],
    });
  });

  it('returns a booking detail for an authenticated administrator', async () => {
    authenticated = true;
    mockGetAdminBooking.mockResolvedValueOnce({ booking_id: 'KDN-123', customer_name: 'Customer One' });

    const response = await request(app).get('/api/admin/bookings/KDN-123');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ booking_id: 'KDN-123', customer_name: 'Customer One' });
    expect(mockGetAdminBooking).toHaveBeenCalledWith('KDN-123');
  });

  it('rejects malformed booking IDs before service access', async () => {
    authenticated = true;

    const response = await request(app).get('/api/admin/bookings/invalid%20id');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockGetAdminBooking).not.toHaveBeenCalled();
  });

  it('returns 404 when the requested booking does not exist', async () => {
    authenticated = true;
    mockGetAdminBooking.mockRejectedValueOnce(Object.assign(new Error('Booking not found'), {
      statusCode: 404,
      code: 'NOT_FOUND',
      type: 'not_found',
    }));

    const response = await request(app).get('/api/admin/bookings/KDN-missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
