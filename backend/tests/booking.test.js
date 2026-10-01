import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const bookingService = vi.hoisted(() => ({
  createBooking: vi.fn(),
}));

vi.mock('../src/services/booking.service.js', () => bookingService);

const { createApp } = await import('../src/app.js');
const app = createApp();

const validPayload = {
  ticketCategoryId: 1,
  quantity: 2,
  customerName: 'Test Customer',
  customerEmail: 'customer@example.com',
  customerPhone: '+919876543210',
};

const postBooking = (payload = validPayload, key = 'kdn-test-idempotency-1234') => request(app)
  .post('/api/bookings')
  .set('Idempotency-Key', key)
  .send(payload);

describe('Public booking API', () => {
  it('creates a booking using the standard response contract', async () => {
    bookingService.createBooking.mockResolvedValueOnce({
      bookingId: 'KDN-test-booking',
      status: 'pending',
      amount: '998.00',
      currency: 'INR',
      reused: false,
    });

    const response = await postBooking();

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: {
        bookingId: 'KDN-test-booking',
        status: 'pending',
        amount: '998.00',
        currency: 'INR',
      },
    });
  });

  it('rejects missing idempotency keys', async () => {
    const response = await request(app).post('/api/bookings').send(validPayload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid quantity', async () => {
    const response = await postBooking({ ...validPayload, quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('Quantity');
  });

  it('rejects invalid email', async () => {
    const response = await postBooking({ ...validPayload, customerEmail: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('email');
  });

  it('rejects missing customer fields', async () => {
    const response = await postBooking({ ...validPayload, customerName: '', customerPhone: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('reuses the idempotent booking response', async () => {
    bookingService.createBooking.mockResolvedValueOnce({
      bookingId: 'KDN-existing',
      status: 'pending',
      amount: '499.00',
      currency: 'INR',
      reused: true,
    });

    const response = await postBooking(validPayload, 'kdn-existing-idempotency-1234');

    expect(response.status).toBe(200);
    expect(response.body.data.bookingId).toBe('KDN-existing');
  });

  it('does not expose customer data or internal fields in the response', async () => {
    bookingService.createBooking.mockResolvedValueOnce({
      bookingId: 'KDN-safe',
      status: 'pending',
      amount: '499.00',
      currency: 'INR',
      reused: false,
      internalDatabaseId: 123,
      customerEmail: 'customer@example.com',
    });

    const response = await postBooking();

    expect(response.body.data).toEqual({
      bookingId: 'KDN-safe',
      status: 'pending',
      amount: '499.00',
      currency: 'INR',
    });
  });
});
