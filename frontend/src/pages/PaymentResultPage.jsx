import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const hasProviderResult = [...searchParams.keys()].length > 0;

  useEffect(() => {
    document.title = 'Payment Result | KESARIYA Dandiya Nights';
  }, []);

  return (
    <PublicLayout>
      <main className="content-section" aria-labelledby="payment-result-title">
        <section className="booking-success">
          <p className="eyebrow">Payment return</p>
          <h1 id="payment-result-title">Payment is being verified</h1>
          <p>
            {hasProviderResult
              ? 'We received the payment provider return. Your booking is confirmed only after the backend verifies the payment.'
              : 'Your payment provider session has returned. Your booking is confirmed only after the backend verifies the payment.'}
          </p>
          <p>
            Do not treat this page as proof of payment. If payment was successful, the trusted backend verification or webhook will update the booking and issue tickets.
          </p>
          <Link className="button" to="/">Return to the event website</Link>
        </section>
      </main>
    </PublicLayout>
  );
}
