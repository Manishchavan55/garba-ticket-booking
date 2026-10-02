import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPool = { execute: vi.fn(), getConnection: vi.fn() };
const mockConnection = { execute: vi.fn(), release: vi.fn() };

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: () => mockPool,
}));

const { getAdminPayment, listAdminPayments } = await import('../src/services/adminPayment.service.js');

describe('admin payment services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.getConnection.mockResolvedValue(mockConnection);
  });

  it('lists payment transaction records with booking context', async () => {
    const rows = [{ id: 7, public_booking_id: 'KDN-123', provider: 'phonepe', payment_status: 'successful' }];
    mockPool.execute.mockResolvedValueOnce([rows]);

    await expect(listAdminPayments()).resolves.toEqual(rows);
    expect(mockPool.execute).toHaveBeenCalledTimes(1);
    expect(mockPool.execute.mock.calls[0][0]).toContain('FROM payments p');
  });

  it('returns a payment by database ID and releases the connection', async () => {
    const row = { id: 7, public_booking_id: 'KDN-123', gateway_transaction_reference: 'ORDER-123' };
    mockConnection.execute.mockResolvedValueOnce([[row]]);

    await expect(getAdminPayment(7)).resolves.toEqual(row);
    expect(mockConnection.execute.mock.calls[0][1]).toEqual([7]);
    expect(mockConnection.release).toHaveBeenCalledOnce();
  });

  it('throws not found for an unknown payment', async () => {
    mockConnection.execute.mockResolvedValueOnce([[]]);

    await expect(getAdminPayment(999)).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
    expect(mockConnection.release).toHaveBeenCalledOnce();
  });
});
