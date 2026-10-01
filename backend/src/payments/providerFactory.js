import { config } from '../config/env.js';
import { createUnavailablePaymentProvider } from './paymentProvider.js';

export const getPaymentProvider = () => {
  if (config.payment.provider === 'unconfigured') {
    return createUnavailablePaymentProvider();
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
