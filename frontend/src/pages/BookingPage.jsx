import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getEvent, getTicketCategories } from '../api/events.js';
import { createBooking } from '../api/bookings.js';
import PaymentAction from '../components/PaymentAction.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const EVENT_IMAGE = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85';
const formatDate = (value) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
const formatTime = (value) => value?.slice(0, 5) ?? '';
const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(price));
const getIdempotencyKey = () => globalThis.crypto?.randomUUID?.() ?? `kdn-${Date.now()}-${Math.random().toString(36).slice(2, 18)}`;

export default function BookingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ticketCategoryId: '', quantity: 1, customerName: '', customerEmail: '', customerPhone: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [booking, setBooking] = useState(null);
  const [idempotencyKey] = useState(getIdempotencyKey);

  useEffect(() => {
    let active = true;
    Promise.all([getEvent(id), getTicketCategories(id)]).then(([eventData, categoryData]) => {
      if (!active) return;
      setEvent(eventData); setCategories(categoryData);
      const requested = categoryData.find((item) => item.id === Number(searchParams.get('category')) && item.availability_status === 'available') || categoryData.find((item) => item.availability_status === 'available');
      setForm((current) => ({ ...current, ticketCategoryId: requested ? String(requested.id) : '' }));
      setStatus('success');
    }).catch((error) => { if (active) setStatus(error?.response?.status === 404 ? 'not-found' : 'error'); });
    return () => { active = false; };
  }, [id, searchParams]);

  const selectedCategory = useMemo(() => categories.find((item) => item.id === Number(form.ticketCategoryId)), [categories, form.ticketCategoryId]);
  const total = selectedCategory ? Number(selectedCategory.price) * Number(form.quantity || 0) : 0;
  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setFieldErrors((current) => ({ ...current, [field]: undefined })); setSubmitError(''); };

  const validate = () => {
    const errors = {};
    if (!form.ticketCategoryId) errors.ticketCategoryId = 'Select a ticket category.';
    if (!Number.isSafeInteger(Number(form.quantity)) || Number(form.quantity) <= 0) errors.quantity = 'Enter a valid quantity.';
    if (step >= 2 && !form.customerName.trim()) errors.customerName = 'Name is required.';
    if (step >= 2 && !/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) errors.customerEmail = 'Enter a valid email.';
    if (step >= 2 && !form.customerPhone.trim()) errors.customerPhone = 'Phone is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (eventValue) => {
    eventValue.preventDefault();
    if (!validate()) return;
    setSubmitStatus('submitting'); setSubmitError('');
    try {
      const result = await createBooking({ eventId: Number(id), ...form, quantity: Number(form.quantity), ticketCategoryId: Number(form.ticketCategoryId), idempotencyKey });
      setBooking(result); setSubmitStatus('success');
    } catch (error) { setSubmitStatus('error'); setSubmitError(error?.response?.data?.error?.message ?? 'We could not create your booking. Please try again.'); }
  };

  if (status === 'loading') return <PublicLayout><main className="public-content"><StatusMessage title="Loading checkout" message="Fetching event and ticket information." /></main></PublicLayout>;
  if (status === 'not-found' || status === 'error' || !event) return <PublicLayout><main className="public-content"><StatusMessage title="Checkout unavailable" message="We could not load this event right now." tone="error" /><Link className="text-link" to={`/events/${id}`}>Back to event</Link></main></PublicLayout>;

  if (submitStatus === 'success' && booking) {
    return <PublicLayout><main className="confirmation-page"><section className="confirmation-card"><div className="success-icon">✓</div><p className="eyebrow">Booking confirmed</p><h1>Your tickets are on the way!</h1><p>Your booking has been created successfully. Payment status will be verified by the backend before the booking is finalized.</p><dl className="confirmation-summary"><div><dt>Booking ID</dt><dd>{booking.bookingId}</dd></div><div><dt>Event</dt><dd>{event.name}</dd></div><div><dt>Date</dt><dd>{formatDate(event.event_date)}</dd></div><div><dt>Total</dt><dd>{formatPrice(booking.amount)}</dd></div></dl><PaymentAction bookingId={booking.bookingId} idempotencyKey={idempotencyKey} /><div className="confirmation-actions"><Link className="button" to="/events">View More Events</Link><Link className="button button--outline" to={`/events/${id}`}>Back to Event</Link></div></section></main></PublicLayout>;
  }

  return (
    <PublicLayout>
      <main className="checkout-page">
        <div className="checkout-stepper" aria-label="Checkout progress"><span className="active">1<br /><small>Tickets</small></span><i /><span className={step >= 2 ? 'active' : ''}>2<br /><small>Attendee Details</small></span><i /><span>3<br /><small>Payment</small></span></div>
        <div className="checkout-layout">
          <section className="checkout-main">
            <div className="checkout-title"><p className="eyebrow">Your selection</p><h1>{step === 1 ? 'Review your tickets' : 'Attendee details'}</h1></div>
            {step === 1 ? (
              <form className="checkout-panel" onSubmit={(eventValue) => { eventValue.preventDefault(); if (validate()) setStep(2); }}>
                <div className="selected-event"><img src={EVENT_IMAGE} alt="Garba event atmosphere" /><div><strong>{event.name}</strong><span>▣ {formatDate(event.event_date)} | {formatTime(event.start_time)}</span><span>⌖ {event.venue}</span></div></div>
                <label>Ticket category<select value={form.ticketCategoryId} onChange={(e) => update('ticketCategoryId', e.target.value)}>{categories.map((category) => <option key={category.id} value={category.id} disabled={category.availability_status !== 'available'}>{category.name} — {formatPrice(category.price)}</option>)}</select></label>
                {fieldErrors.ticketCategoryId && <p className="field-error">{fieldErrors.ticketCategoryId}</p>}
                <label>Quantity<input type="number" min="1" max="20" value={form.quantity} onChange={(e) => update('quantity', e.target.value === '' ? '' : Number(e.target.value))} /></label>
                {fieldErrors.quantity && <p className="field-error">{fieldErrors.quantity}</p>}
                <div className="checkout-line"><span>{selectedCategory?.name || 'Ticket'} × {form.quantity || 0}</span><strong>{formatPrice(total)}</strong></div>
                <div className="checkout-line checkout-line--total"><span>Total Amount</span><strong>{formatPrice(total)}</strong></div>
                <button className="button button--wide" type="submit">Continue</button>
              </form>
            ) : (
              <form className="checkout-panel" onSubmit={handleSubmit} noValidate>
                <label>Full name<input autoComplete="name" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} /></label>{fieldErrors.customerName && <p className="field-error">{fieldErrors.customerName}</p>}
                <label>Email<input type="email" autoComplete="email" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} /></label>{fieldErrors.customerEmail && <p className="field-error">{fieldErrors.customerEmail}</p>}
                <label>Phone<input type="tel" autoComplete="tel" value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} /></label>{fieldErrors.customerPhone && <p className="field-error">{fieldErrors.customerPhone}</p>}
                {submitStatus === 'error' && <StatusMessage title="Booking failed" message={submitError} tone="error" />}
                <div className="payment-method"><span>◉</span><div><strong>PhonePe</strong><small>Secure payment via PhonePe</small></div><b>Recommended</b></div>
                <button className="button button--wide" type="submit" disabled={submitStatus === 'submitting'}>{submitStatus === 'submitting' ? 'Creating booking…' : `Pay ${formatPrice(total)} with PhonePe`}</button>
                <button className="text-button" type="button" onClick={() => setStep(1)}>← Back to tickets</button>
              </form>
            )}
          </section>
          <aside className="checkout-summary"><p className="eyebrow">Order Summary</p><h2>{event.name}</h2><div><span>{selectedCategory?.name || 'Ticket'} × {form.quantity || 0}</span><strong>{formatPrice(total)}</strong></div><div className="checkout-summary__total"><span>Total</span><strong>{formatPrice(total)}</strong></div><small>🔒 100% Secure Payment</small></aside>
        </div>
      </main>
    </PublicLayout>
  );
}
