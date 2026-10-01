import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getEvent, getTicketCategories } from '../api/events.js';
import { createBooking } from '../api/bookings.js';
import PaymentAction from '../components/PaymentAction.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'full',
}).format(new Date(`${value}T00:00:00`));

const formatTime = (value) => value?.slice(0, 5) ?? '';

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(price));

const getIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `kdn-${Date.now()}-${Math.random().toString(36).slice(2, 18)}`;
};

const initialForm = {
  ticketCategoryId: '',
  quantity: 1,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
};

export default function BookingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [booking, setBooking] = useState(null);
  const [idempotencyKey] = useState(getIdempotencyKey);

  useEffect(() => {
    let active = true;
    Promise.all([getEvent(id), getTicketCategories(id)])
      .then(([eventData, categoryData]) => {
        if (!active) return;
        setEvent(eventData);
        setCategories(categoryData);
        const requestedCategory = searchParams.get('category');
        const availableCategory = categoryData.find((category) => category.id === Number(requestedCategory) && category.availability_status === 'available')
          ?? categoryData.find((category) => category.availability_status === 'available');
        setForm((current) => ({ ...current, ticketCategoryId: availableCategory ? String(availableCategory.id) : '' }));
        setStatus('success');
      })
      .catch((error) => {
        if (!active) return;
        setStatus(error?.response?.status === 404 ? 'not-found' : 'error');
      });

    return () => {
      active = false;
    };
  }, [id, searchParams]);

  useEffect(() => {
    document.title = event ? `Book Tickets | ${event.name}` : 'Book Tickets | KESARIYA Dandiya Nights';
  }, [event]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === Number(form.ticketCategoryId)),
    [categories, form.ticketCategoryId],
  );

  const totalPreview = useMemo(() => {
    if (!selectedCategory || !Number.isSafeInteger(Number(form.quantity)) || Number(form.quantity) <= 0) return null;
    return Number(selectedCategory.price) * Number(form.quantity);
  }, [selectedCategory, form.quantity]);

  const validate = () => {
    const errors = {};
    if (!form.ticketCategoryId) errors.ticketCategoryId = 'Select a ticket category.';
    if (!Number.isSafeInteger(Number(form.quantity)) || Number(form.quantity) <= 0) errors.quantity = 'Quantity must be a positive whole number.';
    if (!form.customerName.trim()) errors.customerName = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())) errors.customerEmail = 'Enter a valid email address.';
    if (!form.customerPhone.trim()) errors.customerPhone = 'Phone is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateField = (field) => (eventValue) => {
    setForm((current) => ({ ...current, [field]: eventValue }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = async (eventValue) => {
    eventValue.preventDefault();
    if (!validate()) return;

    setSubmitStatus('submitting');
    setSubmitError('');

    try {
      const result = await createBooking({
        eventId: Number(id),
        ...form,
        quantity: Number(form.quantity),
        ticketCategoryId: Number(form.ticketCategoryId),
        idempotencyKey,
      });
      setBooking(result);
      setSubmitStatus('success');
    } catch (error) {
      setSubmitStatus('error');
      setSubmitError(error?.response?.data?.error?.message ?? 'We could not create your booking. Please try again.');
    }
  };

  if (status === 'loading') {
    return <PublicLayout><main className="content-section"><StatusMessage title="Loading booking" message="Fetching event and ticket information." /></main></PublicLayout>;
  }

  if (status === 'not-found') {
    return <PublicLayout><main className="content-section"><StatusMessage title="Event not found" message="The requested event could not be found." tone="error" /><Link className="text-link" to="/">Return to events</Link></main></PublicLayout>;
  }

  if (status === 'error' || !event) {
    return <PublicLayout><main className="content-section"><StatusMessage title="Booking unavailable" message="We could not load this event right now. Please try again later." tone="error" /><Link className="text-link" to={`/events/${id}`}>Return to event</Link></main></PublicLayout>;
  }

  if (submitStatus === 'success' && booking) {
    return (
      <PublicLayout>
        <main className="content-section">
          <section className="booking-success" aria-labelledby="booking-success-title">
            <p className="eyebrow">Booking created</p>
            <h1 id="booking-success-title">Your booking is pending payment</h1>
            <p>Your booking has been recorded. Payment remains pending until a trusted backend verification from the selected provider succeeds.</p>
            <dl className="booking-summary">
              <div><dt>Booking ID</dt><dd>{booking.bookingId}</dd></div>
              <div><dt>Status</dt><dd>{booking.status}</dd></div>
              <div><dt>Amount</dt><dd>{formatPrice(booking.amount)}</dd></div>
              <div><dt>Currency</dt><dd>{booking.currency}</dd></div>
            </dl>
            <PaymentAction bookingId={booking.bookingId} idempotencyKey={idempotencyKey} />
            <Link className="text-link" to={`/events/${id}`}>Return to event</Link>
          </section>
        </main>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <main className="content-section">
        <section className="booking-header" aria-labelledby="booking-title">
          <p className="eyebrow">{formatDate(event.event_date)} · {formatTime(event.start_time)}</p>
          <h1 id="booking-title">Book tickets for {event.name}</h1>
          <p>{event.venue}</p>
        </section>

        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <fieldset>
            <legend>Ticket selection</legend>
            <label htmlFor="ticket-category">Ticket category</label>
            <select id="ticket-category" value={form.ticketCategoryId} onChange={(e) => updateField('ticketCategoryId')(e.target.value)} disabled={submitStatus === 'submitting'} required>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} disabled={category.availability_status !== 'available'}>
                  {category.name} — {formatPrice(category.price)}{category.availability_status !== 'available' ? ' (Unavailable)' : ''}
                </option>
              ))}
            </select>
            {fieldErrors.ticketCategoryId && <p className="field-error">{fieldErrors.ticketCategoryId}</p>}

            <label htmlFor="quantity">Quantity</label>
            <input id="quantity" type="number" min="1" step="1" inputMode="numeric" value={form.quantity} onChange={(e) => updateField('quantity')(e.target.value === '' ? '' : Number(e.target.value))} disabled={submitStatus === 'submitting'} required />
            {fieldErrors.quantity && <p className="field-error">{fieldErrors.quantity}</p>}

            {selectedCategory && totalPreview !== null && <p className="booking-total">Current total: {formatPrice(totalPreview)}</p>}
          </fieldset>

          <fieldset>
            <legend>Customer information</legend>
            <label htmlFor="customer-name">Full name</label>
            <input id="customer-name" type="text" autoComplete="name" value={form.customerName} onChange={(e) => updateField('customerName')(e.target.value)} disabled={submitStatus === 'submitting'} required />
            {fieldErrors.customerName && <p className="field-error">{fieldErrors.customerName}</p>}

            <label htmlFor="customer-email">Email</label>
            <input id="customer-email" type="email" autoComplete="email" value={form.customerEmail} onChange={(e) => updateField('customerEmail')(e.target.value)} disabled={submitStatus === 'submitting'} required />
            {fieldErrors.customerEmail && <p className="field-error">{fieldErrors.customerEmail}</p>}

            <label htmlFor="customer-phone">Phone</label>
            <input id="customer-phone" type="tel" autoComplete="tel" value={form.customerPhone} onChange={(e) => updateField('customerPhone')(e.target.value)} disabled={submitStatus === 'submitting'} required />
            {fieldErrors.customerPhone && <p className="field-error">{fieldErrors.customerPhone}</p>}
          </fieldset>

          {submitStatus === 'error' && <StatusMessage title="Booking could not be created" message={submitError} tone="error" />}

          <div className="booking-actions">
            <button className="button" type="submit" disabled={submitStatus === 'submitting' || categories.every((category) => category.availability_status !== 'available')}>
              {submitStatus === 'submitting' ? 'Creating booking…' : 'Create booking'}
            </button>
            <Link className="text-link" to={`/events/${id}`}>Back to event</Link>
          </div>

          <p className="booking-payment-note">Payment success is never determined by this browser. The backend must verify the provider result before the booking becomes confirmed.</p>
        </form>
      </main>
    </PublicLayout>
  );
}
