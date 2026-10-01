export class PaymentProviderError extends Error {
  constructor(message, code = 'PAYMENT_PROVIDER_ERROR', statusCode = 502) {
    super(message);
    this.name = 'PaymentProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.type = statusCode >= 500 ? 'internal' : 'conflict';
  }
}

export const createUnavailablePaymentProvider = () => ({
  name: 'unconfigured',

  async createCheckout() {
    throw new PaymentProviderError(
      'No production payment provider is configured yet',
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      503,
    );
  },

  async verifyPayment() {
    throw new PaymentProviderError(
      'Payment verification is unavailable until a production payment provider is configured',
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      503,
    );
  },

  async verifyWebhook() {
    throw new PaymentProviderError(
      'Webhook verification is unavailable until a production payment provider is configured',
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      503,
    );
  },

  normalizeStatus() {
    throw new PaymentProviderError(
      'Payment status normalization is unavailable until a production payment provider is configured',
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      503,
    );
  },
});
