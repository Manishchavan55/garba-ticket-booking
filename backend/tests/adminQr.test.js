import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

let authenticated = false;
const mockListAdminQrTickets = vi.fn();
const mockGetAdminQrTicket = vi.fn();
const mockVerifyQrTicket = vi.fn();

vi.mock('../src/services/adminAuth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(async () => (authenticated ? {
    admin: { id: 1, username: 'admin', email: 'admin@example.com' },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  } : null)),
}));

vi.mock('../src/services/adminQr.service.js', () => ({
  listAdminQrTickets: mockListAdminQrTickets,
  getAdminQrTicket: mockGetAdminQrTicket,
}));

vi.mock('../src/services/ticket.service.js', () => ({
  verifyQrTicket: mockVerifyQrTicket,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('admin QR venue APIs', () => {
  beforeEach(() => {
    authenticated = false;
    vi.clearAllMocks();
  });

  it('rejects unauthenticated QR requests with 401', async () => {
    const response = await request(app).get('/api/admin/qr-tickets');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('allows an authenticated administrator to list QR tickets', async () => {
    authenticated = true;
    mockListAdminQrTickets.mockResolvedValueOnce([{ id: 1, verification_status: 'unused' }]);

    const response = await request(app).get('/api/admin/qr-tickets');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [{ id: 1, verification_status: 'unused' }],
    });
  });

  it('returns QR ticket detail', async () => {
    authenticated = true;
    mockGetAdminQrTicket.mockResolvedValueOnce({ id: 2, verification_status: 'used' });

    const response = await request(app).get('/api/admin/qr-tickets/2');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 2, verification_status: 'used' });
  });

  it('rejects malformed QR ticket IDs', async () => {
    authenticated = true;

    const response = await request(app).get('/api/admin/qr-tickets/0');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockGetAdminQrTicket).not.toHaveBeenCalled();
  });

  it('verifies a venue QR through the existing ticket verification service', async () => {
    authenticated = true;
    mockVerifyQrTicket.mockResolvedValueOnce({ verified: true, status: 'used', bookingId: 'KDN-123' });

    const response = await request(app)
      .post('/api/admin/qr-tickets/verify')
      .send({ qrIdentifier: 'A'.repeat(32) });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { verified: true, status: 'used', bookingId: 'KDN-123' },
    });
    expect(mockVerifyQrTicket).toHaveBeenCalledWith('A'.repeat(32));
  });

  it('rejects malformed QR identifiers before verification', async () => {
    authenticated = true;

    const response = await request(app)
      .post('/api/admin/qr-tickets/verify')
      .send({ qrIdentifier: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_QR_IDENTIFIER');
    expect(mockVerifyQrTicket).not.toHaveBeenCalled();
  });
});
