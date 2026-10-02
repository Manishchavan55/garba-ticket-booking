import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { PaymentProviderError } from './paymentProvider.js';

const SANDBOX_AUTH_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';
const PRODUCTION_AUTH_URL = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';
const SANDBOX_API_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const PRODUCTION_API_BASE_URL = 'https://api.phonepe.com/apis/pg';
const ACCESS_TOKEN_REFRESH_SKEW_SECONDS = 30;
const SUPPORTED_CURRENCY = 'INR';

const normalizeEnvironment = (value) => String(value ?? 'SANDBOX').toUpperCase();

const amountToPaisa = (amount) => {
  const normalized = String(amount ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new PaymentProviderError('Payment amount is invalid for PhonePe', 'PAYMENT_AMOUNT_INVALID', 409);
  }

  const [whole, fraction = ''] = normalized.split('.');
  const paisa = Number(`${whole}${fraction.padEnd(2, '0')}`);
  if (!Number.isSafeInteger(paisa) || paisa < 100) {
    throw new PaymentProviderError('Payment amount is below the PhonePe minimum', 'PAYMENT_AMOUNT_INVALID', 409);
  }
  return paisa;
};

const paisaToAmount = (paisa) => {
  if (!Number.isSafeInteger(paisa) || paisa < 0) {
    throw new PaymentProviderError('PhonePe returned an invalid payment amount', 'PAYMENT_AMOUNT_INVALID', 502);
  }
  return (paisa / 100).toFixed(2);
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new PaymentProviderError('PhonePe returned an invalid response', 'PAYMENT_PROVIDER_INVALID_RESPONSE', 502);
  }
};

const providerError = (message, code = 'PAYMENT_PROVIDER_ERROR') => (
  new PaymentProviderError(message, code, 502)
);

const timingSafeEqualStrings = (left, right) => {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const createPhonePePaymentProvider = (options, fetchImpl = globalThis.fetch) => {
  const environment = normalizeEnvironment(options.environment);
  if (!['SANDBOX', 'PRODUCTION'].includes(environment)) {
    throw new PaymentProviderError('PhonePe environment must be SANDBOX or PRODUCTION', 'PHONEPE_ENVIRONMENT_INVALID', 500);
  }

  const clientId = String(options.clientId ?? '').trim();
  const clientSecret = String(options.clientSecret ?? '').trim();
  const clientVersion = Number(options.clientVersion);
  const redirectUrl = String(options.redirectUrl ?? '').trim();
  const webhookUsername = String(options.webhookUsername ?? '');
  const webhookPassword = String(options.webhookPassword ?? '');

  if (!clientId || !clientSecret || !Number.isInteger(clientVersion) || clientVersion <= 0 || !redirectUrl) {
    throw new PaymentProviderError('PhonePe credentials and redirect URL are not configured', 'PHONEPE_CONFIGURATION_INVALID', 500);
  }

  if (!webhookUsername || !webhookPassword) {
    throw new PaymentProviderError('PhonePe webhook SHA credentials are not configured', 'PHONEPE_WEBHOOK_CONFIGURATION_INVALID', 500);
  }

  const authUrl = environment === 'PRODUCTION' ? PRODUCTION_AUTH_URL : SANDBOX_AUTH_URL;
  const apiBaseUrl = environment === 'PRODUCTION' ? PRODUCTION_API_BASE_URL : SANDBOX_API_BASE_URL;
  let cachedToken = null;
  let tokenExpiresAt = 0;

  const getAccessToken = async () => {
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken && tokenExpiresAt - ACCESS_TOKEN_REFRESH_SKEW_SECONDS > now) {
      return cachedToken;
    }

    let response;
    try {
      response = await fetchImpl(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new globalThis.URLSearchParams({
          client_id: clientId,
          client_version: String(clientVersion),
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        }),
      });
    } catch {
      throw providerError('PhonePe authorization request failed', 'PHONEPE_AUTHORIZATION_FAILED');
    }

    const data = await parseJsonResponse(response);
    if (!response.ok || !data.access_token || !Number.isFinite(Number(data.expires_at))) {
      throw providerError('PhonePe authorization failed', 'PHONEPE_AUTHORIZATION_FAILED');
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Number(data.expires_at);
    return cachedToken;
  };

  const requestPhonePe = async (path, init = {}) => {
    const accessToken = await getAccessToken();
    let response;
    try {
      response = await fetchImpl(`${apiBaseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `O-Bearer ${accessToken}`,
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw providerError('PhonePe request failed', 'PHONEPE_REQUEST_FAILED');
    }

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw providerError('PhonePe rejected the payment request', `PHONEPE_HTTP_${response.status}`);
    }
    return data;
  };

  const normalizeStatus = (payload, bookingId = null) => {
    const state = String(payload?.state ?? '').toUpperCase();
    const merchantOrderId = String(payload?.merchantOrderId ?? '').trim();
    const amount = Number(payload?.amount);
    const metaInfo = payload?.metaInfo && typeof payload.metaInfo === 'object' ? payload.metaInfo : {};

    if (!merchantOrderId || !Number.isSafeInteger(amount) || amount < 0) {
      throw providerError('PhonePe payment status response is invalid', 'PHONEPE_STATUS_INVALID');
    }

    const status = {
      COMPLETED: 'successful',
      FAILED: 'failed',
      CANCELLED: 'failed',
      PENDING: 'pending',
    }[state];

    if (!status) {
      throw new PaymentProviderError('PhonePe returned an unsupported payment state', 'PAYMENT_STATUS_NOT_VERIFIED', 409);
    }

    const resolvedBookingId = bookingId ?? metaInfo.udf1 ?? null;
    if (!resolvedBookingId) {
      throw new PaymentProviderError('PhonePe payment response did not identify the booking', 'PAYMENT_BOOKING_REFERENCE_MISSING', 400);
    }

    return {
      provider: 'phonepe',
      providerTransactionReference: merchantOrderId,
      amount: paisaToAmount(amount),
      currency: SUPPORTED_CURRENCY,
      status,
      bookingId: resolvedBookingId,
    };
  };

  return {
    name: 'phonepe',

    async createCheckout({ bookingId, paymentId, amount, currency }) {
      if (currency !== SUPPORTED_CURRENCY) {
        throw new PaymentProviderError('PhonePe supports INR payments for this integration', 'PAYMENT_CURRENCY_UNSUPPORTED', 409);
      }

      const merchantOrderId = `KDN-PAY-${paymentId}`;
      const amountInPaisa = amountToPaisa(amount);
      const data = await requestPhonePe('/checkout/v2/pay', {
        method: 'POST',
        body: JSON.stringify({
          merchantOrderId,
          amount: amountInPaisa,
          paymentFlow: {
            type: 'PG_CHECKOUT',
            merchantUrls: { redirectUrl },
          },
          metaInfo: {
            udf1: bookingId,
          },
        }),
      });

      if (String(data.state ?? '').toUpperCase() !== 'PENDING' || !data.redirectUrl) {
        throw providerError('PhonePe did not create a checkout session', 'PHONEPE_CHECKOUT_INVALID');
      }

      return {
        providerTransactionReference: merchantOrderId,
        providerOrderId: data.orderId ?? null,
        checkoutUrl: data.redirectUrl,
        expiresAt: data.expireAt ?? null,
      };
    },

    async verifyPayment({ payment, booking, payload }) {
      const merchantOrderId = payment.gatewayTransactionReference || payload?.merchantOrderId;
      if (!merchantOrderId) {
        throw new PaymentProviderError('PhonePe merchant order reference is missing', 'PAYMENT_REFERENCE_MISSING', 409);
      }

      const statusPayload = await requestPhonePe(
        `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false&errorContext=true`,
        { method: 'GET' },
      );

      return normalizeStatus(statusPayload, booking.bookingId);
    },

    async verifyWebhook({ payload, headers }) {
      const authorization = headers?.authorization ?? headers?.Authorization;
      if (!authorization || !timingSafeEqualStrings(authorization, crypto.createHash('sha256').update(`${webhookUsername}:${webhookPassword}`).digest('hex'))) {
        throw new PaymentProviderError('PhonePe webhook authorization failed', 'PAYMENT_WEBHOOK_UNAUTHORIZED', 401);
      }

      const event = String(payload?.event ?? '').trim();
      if (!['checkout.order.completed', 'checkout.order.failed'].includes(event)) {
        throw new PaymentProviderError('Unsupported PhonePe webhook event', 'PAYMENT_WEBHOOK_EVENT_UNSUPPORTED', 400);
      }

      const normalized = normalizeStatus(payload.payload, payload.payload?.metaInfo?.udf1);
      if (event === 'checkout.order.completed' && normalized.status !== 'successful') {
        throw new PaymentProviderError('PhonePe completed webhook has an invalid state', 'PAYMENT_WEBHOOK_STATE_INVALID', 409);
      }
      if (event === 'checkout.order.failed' && normalized.status !== 'failed') {
        throw new PaymentProviderError('PhonePe failed webhook has an invalid state', 'PAYMENT_WEBHOOK_STATE_INVALID', 409);
      }

      return normalized;
    },

    normalizeStatus,
  };
};
