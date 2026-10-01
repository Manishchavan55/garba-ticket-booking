import { useState } from 'react';
import { initiatePayment } from '../api/payments.js';
import StatusMessage from './StatusMessage.jsx';

export default function PaymentAction({ bookingId, idempotencyKey }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setState('initializing');
    setError('');

    try {
      const result = await initiatePayment(bookingId, idempotencyKey);
      if (result.checkout?.checkoutUrl) {
        window.location.assign(result.checkout.checkoutUrl);
        return;
      }

      setState('pending');
    } catch (requestError) {
      setState('error');
      setError(requestError?.response?.data?.error?.message ?? 'Payment checkout is currently unavailable.');
    }
  };

  if (state === 'pending') {
    return (
      <StatusMessage
        title="Payment pending"
        message="Your booking is still awaiting payment. Payment success will only be shown after backend verification from the payment provider."
      />
    );
  }

  return (
    <div className="payment-action">
      {state === 'error' && (
        <StatusMessage
          title="Payment checkout unavailable"
          message={error}
          tone="error"
        />
      )}
      {state === 'initializing' && <p className="payment-state">Initializing secure payment checkout…</p>}
      <button className="button" type="button" onClick={handleContinue} disabled={state === 'initializing'}>
        {state === 'initializing' ? 'Preparing payment…' : 'Continue to payment'}
      </button>
    </div>
  );
}
