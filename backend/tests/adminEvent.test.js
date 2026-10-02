import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

let authenticated = false;
const mockPool = { execute: vi.fn(), getConnection: vi.fn() };
const mockConnection = { execute: vi.fn(), release: vi.fn() };

vi.mock('../src/services/adminAuth.service.js', () => ({
  getAuthenticatedAdmin: vi.fn(async () => (authenticated ? {
    admin: { id: 1, username: 'admin', email: 'admin@example.com' },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  } : null)),
}));

vi.mock('../src/database/connection.js', () => ({
  getDatabasePool: () => mockPool,
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('admin event APIs', () => {
  beforeEach(() => {
    authenticated = false;
    vi.clearAllMocks();
    mockPool.getConnection.mockResolvedValue(mockConnection);
  });

  it('rejects unauthenticated admin requests with 401', async () => {
    const response = await request(app).get('/api/admin/events');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
    });
  });

  it('allows an authenticated administrator to list events', async () => {
    authenticated = true;
    mockPool.execute.mockResolvedValueOnce([[{ id: 1, name: 'KESARIYA' }], []]);
    const response = await request(app).get('/api/admin/events');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [{ id: 1, name: 'KESARIYA' }] });
  });

  it('creates an event with a consistent 201 response', async () => {
    authenticated = true;
    mockPool.execute.mockResolvedValueOnce([{ insertId: 9 }, []]);
    mockConnection.execute.mockResolvedValueOnce([[{ id: 9, name: 'Opening Night' }], []]);
    const response = await request(app).post('/api/admin/events').send({
      name: 'Opening Night',
      event_date: '2026-10-20',
      start_time: '18:00',
      end_time: '22:00',
      venue: 'City Arena',
      guidelines: 'Carry a valid ticket.',
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ id: 9, name: 'Opening Night' });
  });

  it('rejects invalid event IDs before database access', async () => {
    authenticated = true;
    const response = await request(app).get('/api/admin/events/0');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockPool.execute).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing event', async () => {
    authenticated = true;
    mockConnection.execute.mockResolvedValueOnce([[], []]);
    const response = await request(app).get('/api/admin/events/999');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 409 rather than cascading an event delete', async () => {
    authenticated = true;
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([[{ count: 1 }], []]);
    const response = await request(app).delete('/api/admin/events/1');
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    expect(mockConnection.execute).toHaveBeenCalledTimes(2);
  });

  it('creates and updates ticket categories', async () => {
    authenticated = true;
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([{ insertId: 3 }, []])
      .mockResolvedValueOnce([[{ id: 3, event_id: 1, name: 'VIP', price: '500.00', availability_status: 'available' }], []]);
    const createResponse = await request(app).post('/api/admin/events/1/ticket-categories').send({
      name: 'VIP', price: '500.00', availability_status: 'available',
    });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.event_id).toBe(1);

    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 3, event_id: 1, name: 'VIP', price: '500.00' }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{ id: 3, event_id: 1, name: 'VIP', price: '600.00' }], []]);
    const updateResponse = await request(app).patch('/api/admin/ticket-categories/3').send({ price: '600.00' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.price).toBe('600.00');
  });

  it('rejects invalid category price and availability status', async () => {
    authenticated = true;
    const invalidPrice = await request(app).post('/api/admin/events/1/ticket-categories').send({
      name: 'VIP', price: '-1.00', availability_status: 'available',
    });
    expect(invalidPrice.status).toBe(400);

    const invalidStatus = await request(app).post('/api/admin/events/1/ticket-categories').send({
      name: 'VIP', price: '100.00', availability_status: 'sold_out',
    });
    expect(invalidStatus.status).toBe(400);
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  it('returns 404 when a category is created for a missing event', async () => {
    authenticated = true;
    mockConnection.execute.mockResolvedValueOnce([[], []]);
    const response = await request(app).post('/api/admin/events/999/ticket-categories').send({
      name: 'VIP', price: '100.00', availability_status: 'available',
    });
    expect(response.status).toBe(404);
  });

  it('returns a conflict for duplicate category names', async () => {
    authenticated = true;
    mockConnection.execute
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }));
    const response = await request(app).post('/api/admin/events/1/ticket-categories').send({
      name: 'VIP', price: '100.00', availability_status: 'available',
    });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });
});
