import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const hasProviderResult = [...searchParams.keys()].length > 0;
  useEffect(() => { document.title = 'Booking Confirmation | Kesariya'; }, []);

  return (
    <PublicLayout>
      <main className="confirmation-page">
        <section className="confirmation-card">
          <div className="success-icon">✓</div>
          <p className="eyebrow">{hasProviderResult ? 'Payment received' : 'Payment return'}</p>
          <h1>Booking Confirmation</h1>
          <p>{hasProviderResult ? 'We received the payment provider return.' : 'Your payment provider session has returned.'} Your booking is confirmed only after trusted backend verification.</p>
          <div className="confirmation-note"><strong>What happens next?</strong><span>The backend verifies the provider result or webhook and then finalizes the booking. This page alone is not proof of payment.</span></div>
          <div className="confirmation-actions"><Link className="button" to="/events">View Events</Link><Link className="button button--outline" to="/">Back Home</Link></div>
        </section>
      </main>
    </PublicLayout>
  );
}
