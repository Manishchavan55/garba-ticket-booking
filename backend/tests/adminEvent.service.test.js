import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPool = {
  execute: vi.fn(),
  getConnection: vi.fn(),
};

const mockConnection = {
  execute: vi.fn(),
  release: vi.fn(),
};

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: () => mockPool,
}));

const {
  createAdminEvent,
  createAdminTicketCategory,
  deleteAdminEvent,
  deleteAdminTicketCategory,
  getAdminEvent,
  listAdminEvents,
  listAdminTicketCategories,
  updateAdminEvent,
  updateAdminTicketCategory,
} = await import('../src/services/adminEvent.service.js');

describe('admin event and ticket category services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.getConnection.mockResolvedValue(mockConnection);
  });

  it('lists events', async () => {
    mockPool.execute.mockResolvedValueOnce([[{ id: 1, name: 'Night' }], []]);
    await expect(listAdminEvents()).resolves.toEqual([{ id: 1, name: 'Night' }]);
  });

  it('retrieves an existing event', async () => {
    mockConnection.execute.mockResolvedValueOnce([[{ id: 1, name: 'Night' }], []]);
    await expect(getAdminEvent('1')).resolves.toEqual({ id: 1, name: 'Night' });
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it('returns not found for a missing event', async () => {
    mockConnection.execute.mockResolvedValueOnce([[], []]);
    await expect(getAdminEvent('999')).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });

  it('creates an event', async () => {
    mockPool.execute.mockResolvedValueOnce([{ insertId: 7 }, []]);
    mockConnection.execute.mockResolvedValueOnce([[{ id: 7, name: 'Night' }], []]);
    await expect(createAdminEvent({
      name: 'Night', event_date: '2026-10-20', start_time: '18:00', end_time: '22:00', venue: 'Arena', guidelines: null,
    })).resolves.toMatchObject({ id: 7 });
    expect(mockPool.execute).toHaveBeenCalled();
  });

  it('updates only supplied event fields', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1, name: 'Old' }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ id: 1, name: 'New' }], []]);
    await expect(updateAdminEvent('1', { name: 'New' })).resolves.toMatchObject({ name: 'New' });
    expect(mockConnection.execute.mock.calls[1][0]).toContain('name = ?');
    expect(mockConnection.execute.mock.calls[1][0]).not.toContain('venue = ?');
  });

  it('blocks event deletion while categories exist', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[{ count: 1 }], []]);
    await expect(deleteAdminEvent('1')).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('deletes an event with no categories', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[{ count: 0 }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    await expect(deleteAdminEvent('1')).resolves.toBeUndefined();
  });

  it('lists categories only after verifying the event exists', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[{ id: 5, event_id: 1, name: 'VIP' }], []]);
    await expect(listAdminTicketCategories('1')).resolves.toEqual([{ id: 5, event_id: 1, name: 'VIP' }]);
  });

  it('creates a category for an existing event', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([{ insertId: 5 }, []])
      .mockResolvedValueOnce([[{ id: 5, event_id: 1, name: 'VIP' }], []]);
    await expect(createAdminTicketCategory('1', {
      name: 'VIP', price: '500.00', availability_status: 'available',
    })).resolves.toMatchObject({ id: 5, event_id: 1 });
  });

  it('maps duplicate category names to a conflict', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }));
    await expect(createAdminTicketCategory('1', {
      name: 'VIP', price: '500.00', availability_status: 'available',
    })).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('updates category price without rewriting booking history', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 5, event_id: 1, name: 'VIP', price: '500.00' }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ id: 5, event_id: 1, name: 'VIP', price: '600.00' }], []]);
    await expect(updateAdminTicketCategory('5', { price: '600.00' })).resolves.toMatchObject({ price: '600.00' });
    expect(mockConnection.execute.mock.calls[1][0]).toContain('price = ?');
    expect(mockConnection.execute.mock.calls[1][0]).not.toContain('bookings');
  });

  it('blocks category deletion when booking history exists', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 5 }], []])
      .mockResolvedValueOnce([[{ count: 2 }], []]);
    await expect(deleteAdminTicketCategory('5')).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });

  it('deletes an unused category', async () => {
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 5 }], []])
      .mockResolvedValueOnce([[{ count: 0 }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    await expect(deleteAdminTicketCategory('5')).resolves.toBeUndefined();
  });
});
