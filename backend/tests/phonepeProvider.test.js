import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createPhonePePaymentProvider } from '../src/payments/phonepeProvider.js';

const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

const makeProvider = (fetchImpl) => createPhonePePaymentProvider({
  environment: 'SANDBOX',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  clientVersion: 1,
  redirectUrl: 'https://frontend.example/payment/result',
  webhookUsername: 'webhook-user',
  webhookPassword: 'webhook-password',
}, fetchImpl);

describe('PhonePe payment provider', () => {
  it('creates a Standard Checkout session with the authoritative amount in paisa', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({
        access_token: 'access-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }))
      .mockResolvedValueOnce(response({
        orderId: 'OMO123',
        state: 'PENDING',
        expireAt: 1730000000000,
        redirectUrl: 'https://mercury-uat.phonepe.com/transact/test',
      }));

    const provider = makeProvider(fetchImpl);
    const result = await provider.createCheckout({
      bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
      paymentId: 44,
      amount: '499.00',
      currency: 'INR',
    });

    expect(result).toEqual({
      providerTransactionReference: 'KDN-PAY-44',
      providerOrderId: 'OMO123',
      checkoutUrl: 'https://mercury-uat.phonepe.com/transact/test',
      expiresAt: 1730000000000,
    });

    const [, paymentRequest] = fetchImpl.mock.calls;
    expect(paymentRequest.headers.Authorization).toBe('O-Bearer access-token');
    expect(JSON.parse(paymentRequest.body)).toMatchObject({
      merchantOrderId: 'KDN-PAY-44',
      amount: 49900,
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: { redirectUrl: 'https://frontend.example/payment/result' },
      },
      metaInfo: { udf1: 'KDN-12345678-1234-4234-8234-123456789012' },
    });
  });

  it('reuses a cached authorization token for subsequent requests', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({
        access_token: 'access-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }))
      .mockResolvedValue(response({
        orderId: 'OMO123',
        state: 'PENDING',
        redirectUrl: 'https://mercury-uat.phonepe.com/transact/test',
      }));

    const provider = makeProvider(fetchImpl);
    const input = {
      bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
      paymentId: 44,
      amount: '499.00',
      currency: 'INR',
    };

    await provider.createCheckout(input);
    await provider.createCheckout(input);

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token');
  });

  it('verifies payment status server-to-server and normalizes completed, failed, and cancelled states', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({
        access_token: 'access-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }))
      .mockResolvedValueOnce(response({
        merchantOrderId: 'KDN-PAY-44',
        state: 'COMPLETED',
        amount: 49900,
      }));

    const provider = makeProvider(fetchImpl);
    const result = await provider.verifyPayment({
      payment: { gatewayTransactionReference: 'KDN-PAY-44' },
      booking: { bookingId: 'KDN-12345678-1234-4234-8234-123456789012' },
      payload: { status: 'paid' },
    });

    expect(result).toMatchObject({
      provider: 'phonepe',
      providerTransactionReference: 'KDN-PAY-44',
      amount: '499.00',
      currency: 'INR',
      status: 'successful',
      bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
    });
    expect(fetchImpl.mock.calls[1][0]).toContain('/checkout/v2/order/KDN-PAY-44/status');

    expect(provider.normalizeStatus({
      merchantOrderId: 'KDN-PAY-44',
      state: 'FAILED',
      amount: 49900,
      metaInfo: { udf1: 'KDN-12345678-1234-4234-8234-123456789012' },
    })).toMatchObject({ status: 'failed' });

    expect(provider.normalizeStatus({
      merchantOrderId: 'KDN-PAY-44',
      state: 'CANCELLED',
      amount: 49900,
      metaInfo: { udf1: 'KDN-12345678-1234-4234-8234-123456789012' },
    })).toMatchObject({ status: 'failed' });
  });

  it('rejects an amount/currency combination that cannot be processed by PhonePe', async () => {
    const fetchImpl = vi.fn();
    const provider = makeProvider(fetchImpl);

    await expect(provider.createCheckout({
      bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
      paymentId: 44,
      amount: '499.00',
      currency: 'USD',
    })).rejects.toMatchObject({ code: 'PAYMENT_CURRENCY_UNSUPPORTED', statusCode: 409 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('authenticates SHA webhooks before accepting payment state changes', async () => {
    const provider = makeProvider(vi.fn());
    const payload = {
      event: 'checkout.order.completed',
      payload: {
        merchantOrderId: 'KDN-PAY-44',
        state: 'COMPLETED',
        amount: 49900,
        metaInfo: { udf1: 'KDN-12345678-1234-4234-8234-123456789012' },
      },
    };
    const authorization = crypto
      .createHash('sha256')
      .update('webhook-user:webhook-password')
      .digest('hex');

    const result = await provider.verifyWebhook({
      payload,
      headers: { authorization },
    });

    expect(result).toMatchObject({
      provider: 'phonepe',
      providerTransactionReference: 'KDN-PAY-44',
      amount: '499.00',
      status: 'successful',
      bookingId: 'KDN-12345678-1234-4234-8234-123456789012',
    });
  });

  it('rejects forged or unsupported webhooks', async () => {
    const provider = makeProvider(vi.fn());
    const payload = {
      event: 'checkout.order.completed',
      payload: {
        merchantOrderId: 'KDN-PAY-44',
        state: 'COMPLETED',
        amount: 49900,
        metaInfo: { udf1: 'KDN-12345678-1234-4234-8234-123456789012' },
      },
    };

    await expect(provider.verifyWebhook({
      payload,
      headers: { authorization: 'forged' },
    })).rejects.toMatchObject({ code: 'PAYMENT_WEBHOOK_UNAUTHORIZED', statusCode: 401 });

    await expect(provider.verifyWebhook({
      payload: { ...payload, event: 'pg.refund.completed' },
      headers: {
        authorization: crypto.createHash('sha256').update('webhook-user:webhook-password').digest('hex'),
      },
    })).rejects.toMatchObject({ code: 'PAYMENT_WEBHOOK_EVENT_UNSUPPORTED', statusCode: 400 });
  });
});
