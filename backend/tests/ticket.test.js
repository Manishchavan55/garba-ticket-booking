import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const ticketServiceMock = vi.hoisted(() => ({
  verifyQrTicket: vi.fn().mockResolvedValue({
    verified: true,
    status: 'used',
    bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
  }),
}));

vi.mock('../src/services/ticket.service.js', () => ticketServiceMock);

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('Ticket API boundary', () => {
  it('rejects malformed QR identifiers before reaching the service', async () => {
    const response = await request(app)
      .post('/api/tickets/verify')
      .send({ qrIdentifier: 'bad' })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_QR_IDENTIFIER',
        message: 'QR identifier is invalid',
      },
    });
    expect(ticketServiceMock.verifyQrTicket).not.toHaveBeenCalled();
  });

  it('returns the verified ticket result using the standard success envelope', async () => {
    const qrIdentifier = 'A'.repeat(43);

    const response = await request(app)
      .post('/api/tickets/verify')
      .send({ qrIdentifier })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        verified: true,
        status: 'used',
        bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
      },
    });
    expect(ticketServiceMock.verifyQrTicket).toHaveBeenCalledWith(qrIdentifier);
  });
});
