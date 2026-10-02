import { useEffect, useState } from 'react';
import { createAdminSponsor, deleteAdminSponsor, listAdminSponsors, updateAdminSponsor } from '../api/adminSponsors.js';

const emptyForm = { name: '', logoUrl: '', inquiryInformation: '', isActive: true };

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listAdminSponsors();
      setSponsors(response.data ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load sponsors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      ...form,
      name: form.name.trim(),
      logoUrl: form.logoUrl.trim() || null,
      inquiryInformation: form.inquiryInformation.trim() || null,
    };
    try {
      if (editingId) await updateAdminSponsor(editingId, payload);
      else await createAdminSponsor(payload);
      setMessage(editingId ? 'Sponsor updated.' : 'Sponsor created.');
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to save sponsor.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (sponsor) => {
    setEditingId(sponsor.id);
    setForm({
      name: sponsor.name,
      logoUrl: sponsor.logo_url ?? '',
      inquiryInformation: sponsor.inquiry_information ?? '',
      isActive: Boolean(sponsor.is_active),
    });
    setMessage('');
    setError('');
  };

  const remove = async (id) => {
    setError('');
    setMessage('');
    try {
      await deleteAdminSponsor(id);
      setMessage('Sponsor deleted.');
      if (editingId === id) { setEditingId(null); setForm(emptyForm); }
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to delete sponsor.');
    }
  };

  return (
    <main className="page-shell admin-sponsors-page">
      <section className="admin-auth-card" aria-labelledby="admin-sponsors-heading">
        <p className="eyebrow">Content management</p>
        <h1 id="admin-sponsors-heading">Sponsor management</h1>
        <p className="muted-copy">Manage sponsor names, optional logo URLs, inquiry information, and publication status.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}

        <form className="admin-sponsor-form" onSubmit={submit}>
          <label>Sponsor name<input required value={form.name} maxLength="200" onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Logo URL<input type="url" value={form.logoUrl} maxLength="2048" onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></label>
          <label>Inquiry information<textarea value={form.inquiryInformation} onChange={(e) => setForm({ ...form, inquiryInformation: e.target.value })} rows="4" /></label>
          <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update sponsor' : 'Create sponsor'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
          </div>
        </form>

        <section aria-labelledby="admin-sponsors-list-heading">
          <h2 id="admin-sponsors-list-heading">Sponsors</h2>
          {loading && <p role="status">Loading sponsors…</p>}
          {!loading && sponsors.length === 0 && <p className="muted-copy">No sponsors have been created.</p>}
          {!loading && sponsors.length > 0 && (
            <div className="sponsor-admin-list">
              {sponsors.map((sponsor) => (
                <article className="sponsor-admin-row" key={sponsor.id}>
                  <div>
                    <strong>{sponsor.name}</strong>
                    <p>{sponsor.is_active ? 'Active' : 'Inactive'}</p>
                    {sponsor.logo_url && <p className="sponsor-url">{sponsor.logo_url}</p>}
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => edit(sponsor)}>Edit</button>
                    <button type="button" onClick={() => remove(sponsor.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
