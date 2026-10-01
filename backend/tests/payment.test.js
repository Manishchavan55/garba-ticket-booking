import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Payment API boundary', () => {
  it('rejects payment initiation without an idempotency key', async () => {
    const response = await request(app)
      .post('/api/bookings/KDN-12345678-1234-4234-8234-123456789012/payment')
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not accept a browser-only paid status as verification', async () => {
    const response = await request(app)
      .post('/api/payments/verify')
      .send({
        bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
        status: 'paid',
      })
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('PAYMENT_PROVIDER_NOT_CONFIGURED');
  });

  it('does not expose provider-specific secrets or credentials in the public API contract', async () => {
    const response = await request(app)
      .post('/api/payments/webhook')
      .send({ arbitrary: 'payload' })
      .expect(503);

    expect(JSON.stringify(response.body)).not.toMatch(/secret|password|authorization/i);
  });
});
