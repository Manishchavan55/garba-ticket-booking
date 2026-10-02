import { useEffect, useState } from 'react';
import { getAdminBooking, listAdminBookings } from '../api/adminBookings.js';

const getErrorMessage = (error) => error?.response?.data?.error?.message ?? 'Something went wrong. Please try again.';

const formatMoney = (amount, currency) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAdminBookings();
      setBookings(result.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const loadBooking = async (bookingId) => {
    setSelectedBookingId(bookingId);
    setDetailLoading(true);
    setError('');
    try {
      const result = await getAdminBooking(bookingId);
      setSelectedBooking(result.data);
    } catch (requestError) {
      setSelectedBooking(null);
      setError(getErrorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  return (
    <main className="page-shell admin-bookings-page">
      <section className="section-heading">
        <p className="eyebrow">Protected administration</p>
        <h1>Booking management</h1>
        <p className="muted-copy">Review customer bookings and their authoritative booking totals. Payment transactions and QR operations remain in their separate modules.</p>
      </section>

      {error && <p className="status-message status-message--error" role="alert">{error}</p>}

      <section className="admin-management-grid">
        <section aria-labelledby="booking-list-heading">
          <div className="section-heading">
            <h2 id="booking-list-heading">Bookings</h2>
            <p className="muted-copy">{bookings.length} booking{bookings.length === 1 ? '' : 's'}</p>
          </div>
          {loading ? <p className="status-message">Loading bookings…</p> : bookings.length === 0 ? <p className="status-message">No bookings have been created yet.</p> : (
            <div className="event-list" role="list">
              {bookings.map((booking) => (
                <article className={`event-card${selectedBookingId === booking.booking_id ? ' event-card--selected' : ''}`} key={booking.booking_id} role="listitem">
                  <div>
                    <h3>{booking.booking_id}</h3>
                    <p>{booking.customer_name} · {booking.event_name} · {booking.ticket_category_name}</p>
                    <p>{booking.quantity} ticket{booking.quantity === 1 ? '' : 's'} · {formatMoney(booking.total_amount, booking.currency)} · {booking.booking_status}</p>
                  </div>
                  <button className="button" type="button" onClick={() => loadBooking(booking.booking_id)} disabled={detailLoading && selectedBookingId === booking.booking_id}>
                    {detailLoading && selectedBookingId === booking.booking_id ? 'Loading…' : 'View'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="admin-booking-detail" aria-labelledby="booking-detail-heading">
          <h2 id="booking-detail-heading">Booking details</h2>
          {!selectedBooking && !detailLoading && <p className="status-message">Select a booking to view its details.</p>}
          {detailLoading && <p className="status-message">Loading booking details…</p>}
          {selectedBooking && !detailLoading && (
            <dl className="admin-identity">
              <div><dt>Booking ID</dt><dd>{selectedBooking.booking_id}</dd></div>
              <div><dt>Event</dt><dd>{selectedBooking.event_name}</dd></div>
              <div><dt>Ticket category</dt><dd>{selectedBooking.ticket_category_name}</dd></div>
              <div><dt>Customer</dt><dd>{selectedBooking.customer_name}</dd></div>
              <div><dt>Email</dt><dd>{selectedBooking.customer_email}</dd></div>
              <div><dt>Phone</dt><dd>{selectedBooking.customer_phone}</dd></div>
              <div><dt>Quantity</dt><dd>{selectedBooking.quantity}</dd></div>
              <div><dt>Subtotal</dt><dd>{formatMoney(selectedBooking.subtotal_amount, selectedBooking.currency)}</dd></div>
              <div><dt>Total</dt><dd>{formatMoney(selectedBooking.total_amount, selectedBooking.currency)}</dd></div>
              <div><dt>Booking status</dt><dd>{selectedBooking.booking_status}</dd></div>
              <div><dt>Created</dt><dd>{formatDateTime(selectedBooking.created_at)}</dd></div>
              <div><dt>Updated</dt><dd>{formatDateTime(selectedBooking.updated_at)}</dd></div>
            </dl>
          )}
        </aside>
      </section>
    </main>
  );
}
