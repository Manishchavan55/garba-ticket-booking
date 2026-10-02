import { useEffect, useState } from 'react';
import { deleteAdminInquiry, getAdminInquiry, listAdminInquiries, updateAdminInquiry } from '../api/adminInquiries.js';

const STATUS_OPTIONS = ['new', 'in_progress', 'resolved', 'closed'];

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('new');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listAdminInquiries();
      setInquiries(response.data ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const view = async (id) => {
    setError('');
    setMessage('');
    try {
      const response = await getAdminInquiry(id);
      setSelected(response.data);
      setStatus(response.data.inquiry_status);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load the inquiry.');
    }
  };

  const saveStatus = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await updateAdminInquiry(selected.id, { inquiryStatus: status });
      setSelected(response.data);
      setMessage('Inquiry status updated.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to update the inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await deleteAdminInquiry(selected.id);
      setSelected(null);
      setMessage('Inquiry deleted.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to delete the inquiry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page-shell admin-inquiries-page">
      <section className="admin-auth-card" aria-labelledby="admin-inquiries-heading">
        <p className="eyebrow">Contact management</p>
        <h1 id="admin-inquiries-heading">Inquiries</h1>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}
        {loading && <p role="status">Loading inquiries…</p>}
        {!loading && inquiries.length === 0 && <p className="muted-copy">No inquiries have been submitted.</p>}
        {!loading && inquiries.length > 0 && (
          <div className="inquiry-layout">
            <div className="inquiry-list" aria-label="Inquiry list">
              {inquiries.map((inquiry) => (
                <button className="inquiry-list-item" type="button" key={inquiry.id} onClick={() => view(inquiry.id)} aria-label={`View inquiry from ${inquiry.name}`}>
                  <strong>{inquiry.name}</strong>
                  <span>{inquiry.email}</span>
                  <span>{inquiry.inquiry_status}</span>
                </button>
              ))}
            </div>
            {selected && (
              <article className="inquiry-detail" aria-labelledby="inquiry-detail-heading">
                <h2 id="inquiry-detail-heading">Inquiry details</h2>
                <dl>
                  <dt>Name</dt><dd>{selected.name}</dd>
                  <dt>Email</dt><dd>{selected.email}</dd>
                  {selected.phone && <><dt>Phone</dt><dd>{selected.phone}</dd></>}
                  <dt>Message</dt><dd className="inquiry-message">{selected.message}</dd>
                  <dt>Created</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd>
                </dl>
                <form onSubmit={saveStatus} className="inquiry-status-form">
                  <label htmlFor="inquiry-status">Status</label>
                  <select id="inquiry-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update status'}</button>
                  <button type="button" disabled={saving} onClick={remove}>Delete inquiry</button>
                </form>
              </article>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
