import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPool = { execute: vi.fn() };

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: () => mockPool,
}));

describe('admin QR service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists QR tickets with booking and event context', async () => {
    mockPool.execute.mockResolvedValueOnce([[{ id: 1, verification_status: 'unused', event_name: 'KESARIYA Dandiya Nights' }], []]);

    const { listAdminQrTickets } = await import('../src/services/adminQr.service.js');
    const result = await listAdminQrTickets();

    expect(result).toEqual([{ id: 1, verification_status: 'unused', event_name: 'KESARIYA Dandiya Nights' }]);
    expect(mockPool.execute).toHaveBeenCalledTimes(1);
  });

  it('returns a QR ticket by internal ID', async () => {
    mockPool.execute.mockResolvedValueOnce([[{ id: 7, qr_identifier: 'opaque-value', verification_status: 'used' }], []]);

    const { getAdminQrTicket } = await import('../src/services/adminQr.service.js');
    const result = await getAdminQrTicket(7);

    expect(result.id).toBe(7);
    expect(result.verification_status).toBe('used');
  });

  it('returns not found when a QR ticket does not exist', async () => {
    mockPool.execute.mockResolvedValueOnce([[], []]);

    const { getAdminQrTicket } = await import('../src/services/adminQr.service.js');

    await expect(getAdminQrTicket(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});
