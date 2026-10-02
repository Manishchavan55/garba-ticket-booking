import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPool = { execute: vi.fn(), getConnection: vi.fn() };
const mockConnection = { execute: vi.fn(), release: vi.fn() };

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: () => mockPool,
}));

const { getAdminBooking, listAdminBookings } = await import('../src/services/adminBooking.service.js');

describe('admin booking services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.getConnection.mockResolvedValue(mockConnection);
  });

  it('lists bookings with event and ticket category context', async () => {
    const booking = {
      id: 1,
      booking_id: 'KDN-123',
      ticket_category_id: 2,
      ticket_category_name: 'VIP',
      event_id: 3,
      event_name: 'KESARIYA Dandiya Nights',
      customer_name: 'Customer One',
      customer_email: 'customer@example.com',
      customer_phone: '+919999999999',
      quantity: 2,
      subtotal_amount: '1000.00',
      total_amount: '1000.00',
      currency: 'INR',
      booking_status: 'pending',
    };
    mockPool.execute.mockResolvedValueOnce([[booking], []]);

    await expect(listAdminBookings()).resolves.toEqual([booking]);
    expect(mockPool.execute.mock.calls[0][0]).toContain('INNER JOIN ticket_categories');
    expect(mockPool.execute.mock.calls[0][0]).toContain('INNER JOIN events');
    expect(mockPool.execute.mock.calls[0][0]).not.toContain('payments');
    expect(mockPool.execute.mock.calls[0][0]).not.toContain('qr_tickets');
  });

  it('retrieves a booking by public booking ID', async () => {
    const booking = { id: 1, booking_id: 'KDN-123', booking_status: 'confirmed' };
    mockConnection.execute.mockResolvedValueOnce([[booking], []]);

    await expect(getAdminBooking('KDN-123')).resolves.toEqual(booking);
    expect(mockConnection.execute.mock.calls[0][1]).toEqual(['KDN-123']);
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it('returns not found for an unknown booking ID', async () => {
    mockConnection.execute.mockResolvedValueOnce([[], []]);

    await expect(getAdminBooking('KDN-missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it('does not expose payment or QR records through the booking service', async () => {
    mockPool.execute.mockResolvedValueOnce([[{ booking_id: 'KDN-123' }], []]);
    await listAdminBookings();
    const sql = mockPool.execute.mock.calls[0][0];
    expect(sql).not.toContain('FROM payments');
    expect(sql).not.toContain('JOIN payments');
    expect(sql).not.toContain('FROM qr_tickets');
    expect(sql).not.toContain('JOIN qr_tickets');
  });
});
