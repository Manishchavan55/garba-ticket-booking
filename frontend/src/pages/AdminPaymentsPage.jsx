import { useEffect, useState } from 'react';
import { getAdminPayment, listAdminPayments } from '../api/adminPayments.js';

const formatMoney = (amount, currency) => `${currency} ${amount}`;

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await listAdminPayments();
        if (active) setPayments(response.data ?? []);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.error?.message || 'Unable to load payment transactions.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const openPayment = async (paymentId) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const response = await getAdminPayment(paymentId);
      setSelectedPayment(response.data);
    } catch (requestError) {
      setDetailError(requestError.response?.data?.error?.message || 'Unable to load payment details.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <main className="page-shell admin-payments-page">
      <section className="admin-auth-card" aria-labelledby="admin-payments-heading">
        <p className="eyebrow">Payment records</p>
        <h1 id="admin-payments-heading">Payment &amp; transaction management</h1>
        <p className="muted-copy">Review recorded payment transactions and their associated bookings. Payment records are read-only in this module.</p>

        {loading && <p role="status">Loading payment transactions…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && payments.length === 0 && <p className="muted-copy">No payment transactions have been recorded.</p>}

        {!loading && !error && payments.length > 0 && (
          <div className="admin-payment-list" aria-label="Payment transactions">
            {payments.map((payment) => (
              <article className="admin-payment-row" key={payment.id}>
                <div>
                  <strong>Transaction #{payment.id}</strong>
                  <p>{payment.public_booking_id} · {payment.event_name}</p>
                  <p>{payment.provider || 'Provider pending'} · {payment.gateway_transaction_reference || 'Reference pending'}</p>
                </div>
                <div>
                  <strong>{formatMoney(payment.amount, payment.currency)}</strong>
                  <p>{payment.payment_status}</p>
                  <button type="button" onClick={() => openPayment(payment.id)}>View details</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {detailLoading && <p role="status">Loading transaction details…</p>}
        {detailError && <p className="form-error" role="alert">{detailError}</p>}
        {selectedPayment && !detailLoading && (
          <section className="admin-payment-detail" aria-labelledby="payment-detail-heading">
            <h2 id="payment-detail-heading">Transaction #{selectedPayment.id}</h2>
            <dl className="admin-identity">
              <div><dt>Booking</dt><dd>{selectedPayment.public_booking_id}</dd></div>
              <div><dt>Customer</dt><dd>{selectedPayment.customer_name}</dd></div>
              <div><dt>Event</dt><dd>{selectedPayment.event_name}</dd></div>
              <div><dt>Category</dt><dd>{selectedPayment.ticket_category_name}</dd></div>
              <div><dt>Provider</dt><dd>{selectedPayment.provider || '—'}</dd></div>
              <div><dt>Transaction reference</dt><dd>{selectedPayment.gateway_transaction_reference || '—'}</dd></div>
              <div><dt>Amount</dt><dd>{formatMoney(selectedPayment.amount, selectedPayment.currency)}</dd></div>
              <div><dt>Payment status</dt><dd>{selectedPayment.payment_status}</dd></div>
              <div><dt>Recorded</dt><dd>{new Date(selectedPayment.created_at).toLocaleString()}</dd></div>
            </dl>
          </section>
        )}
      </section>
    </main>
  );
}
