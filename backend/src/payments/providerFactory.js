import { config } from '../config/env.js';

export const getPaymentProvider = () => {
  if (config.payment.provider === 'unconfigured') {
    const error = new Error('No production payment provider is configured yet');
    error.statusCode = 503;
    error.code = 'PAYMENT_PROVIDER_NOT_CONFIGURED';
    error.type = 'internal';
    throw error;
  }

  throw Object.assign(
    new Error(`Unsupported payment provider: ${config.payment.provider}`),
    {
      statusCode: 500,
      code: 'UNSUPPORTED_PAYMENT_PROVIDER',
      type: 'internal',
    },
  );
};
