import { useEffect, useState } from 'react';
import { getAdminQrTicket, listAdminQrTickets, verifyVenueQr } from '../api/adminQr.js';

const statusLabel = (status) => status.replace(/_/g, ' ');

export default function AdminQrPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrIdentifier, setQrIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listAdminQrTickets();
      setTickets(response.data ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load QR tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openTicket = async (ticketId) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const response = await getAdminQrTicket(ticketId);
      setSelectedTicket(response.data);
    } catch (requestError) {
      setDetailError(requestError.response?.data?.error?.message || 'Unable to load QR ticket details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setVerifyLoading(true);
    setVerificationMessage('');
    setVerificationError('');
    try {
      const response = await verifyVenueQr(qrIdentifier.trim());
      setVerificationMessage(`Entry verified for booking ${response.data.bookingId}.`);
      setQrIdentifier('');
      await loadTickets();
    } catch (requestError) {
      setVerificationError(requestError.response?.data?.error?.message || 'QR verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <main className="page-shell admin-qr-page">
      <section className="admin-auth-card" aria-labelledby="admin-qr-heading">
        <p className="eyebrow">Venue operations</p>
        <h1 id="admin-qr-heading">QR ticket verification</h1>
        <p className="muted-copy">Review QR ticket status and verify a QR identifier using the existing one-time entry verification service.</p>

        <form className="admin-qr-verify" onSubmit={verify}>
          <label htmlFor="qr-identifier">QR identifier</label>
          <input
            id="qr-identifier"
            value={qrIdentifier}
            onChange={(event) => setQrIdentifier(event.target.value)}
            autoComplete="off"
            inputMode="text"
            minLength={32}
            maxLength={191}
            required
          />
          <button type="submit" disabled={verifyLoading}>{verifyLoading ? 'Verifying…' : 'Verify entry'}</button>
        </form>

        {verificationMessage && <p className="form-success" role="status">{verificationMessage}</p>}
        {verificationError && <p className="form-error" role="alert">{verificationError}</p>}
        {loading && <p role="status">Loading QR tickets…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && tickets.length === 0 && <p className="muted-copy">No QR tickets have been issued.</p>}

        {!loading && !error && tickets.length > 0 && (
          <div className="admin-qr-list" aria-label="QR tickets">
            {tickets.map((ticket) => (
              <article className="admin-qr-row" key={ticket.id}>
                <div>
                  <strong>QR ticket #{ticket.id}</strong>
                  <p>{ticket.public_booking_id} · {ticket.event_name}</p>
                  <p>{ticket.ticket_category_name} · {statusLabel(ticket.verification_status)}</p>
                </div>
                <button type="button" onClick={() => openTicket(ticket.id)}>View details</button>
              </article>
            ))}
          </div>
        )}

        {detailLoading && <p role="status">Loading QR ticket details…</p>}
        {detailError && <p className="form-error" role="alert">{detailError}</p>}
        {selectedTicket && !detailLoading && (
          <section className="admin-qr-detail" aria-labelledby="qr-detail-heading">
            <h2 id="qr-detail-heading">QR ticket #{selectedTicket.id}</h2>
            <dl className="admin-identity">
              <div><dt>Booking</dt><dd>{selectedTicket.public_booking_id}</dd></div>
              <div><dt>Customer</dt><dd>{selectedTicket.customer_name}</dd></div>
              <div><dt>Event</dt><dd>{selectedTicket.event_name}</dd></div>
              <div><dt>Category</dt><dd>{selectedTicket.ticket_category_name}</dd></div>
              <div><dt>Status</dt><dd>{statusLabel(selectedTicket.verification_status)}</dd></div>
              <div><dt>Verified at</dt><dd>{selectedTicket.verified_at ? new Date(selectedTicket.verified_at).toLocaleString() : '—'}</dd></div>
              <div><dt>Used at</dt><dd>{selectedTicket.used_at ? new Date(selectedTicket.used_at).toLocaleString() : '—'}</dd></div>
            </dl>
          </section>
        )}
      </section>
    </main>
  );
}
