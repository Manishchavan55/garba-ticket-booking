import { useEffect, useState } from 'react';
import { createAdminGallery, deleteAdminGallery, listAdminGallery, updateAdminGallery } from '../api/adminGallery.js';

const emptyForm = { title: '', mediaType: 'image', mediaUrl: '', altText: '', isActive: true };

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);
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
      const response = await listAdminGallery();
      setItems(response.data ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load gallery items.');
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
    const payload = { ...form, title: form.title || null, altText: form.altText || null };
    try {
      if (editingId) await updateAdminGallery(editingId, payload);
      else await createAdminGallery(payload);
      setMessage(editingId ? 'Gallery item updated.' : 'Gallery item created.');
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to save gallery item.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title ?? '', mediaType: item.media_type, mediaUrl: item.media_url,
      altText: item.alt_text ?? '', isActive: Boolean(item.is_active),
    });
    setMessage('');
    setError('');
  };

  const remove = async (id) => {
    setError('');
    setMessage('');
    try {
      await deleteAdminGallery(id);
      setMessage('Gallery item deleted.');
      if (editingId === id) { setEditingId(null); setForm(emptyForm); }
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to delete gallery item.');
    }
  };

  return (
    <main className="page-shell admin-gallery-page">
      <section className="admin-auth-card" aria-labelledby="admin-gallery-heading">
        <p className="eyebrow">Content management</p>
        <h1 id="admin-gallery-heading">Gallery management</h1>
        <p className="muted-copy">Manage gallery records using media URLs. File upload and storage are not part of this workstream.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}

        <form className="admin-gallery-form" onSubmit={submit}>
          <label>Title<input value={form.title} maxLength="200" onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Media type<select value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value })}><option value="image">Image</option><option value="video">Video</option></select></label>
          <label>Media URL<input required type="text" value={form.mediaUrl} maxLength="2048" onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} /></label>
          <label>Alt text<input value={form.altText} maxLength="255" onChange={(e) => setForm({ ...form, altText: e.target.value })} /></label>
          <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="form-actions">
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update gallery item' : 'Create gallery item'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}
          </div>
        </form>

        <section aria-labelledby="admin-gallery-list-heading">
          <h2 id="admin-gallery-list-heading">Gallery items</h2>
          {loading && <p role="status">Loading gallery items…</p>}
          {!loading && items.length === 0 && <p className="muted-copy">No gallery items have been created.</p>}
          {!loading && items.length > 0 && <div className="admin-gallery-list">
            {items.map((item) => (
              <article className="admin-gallery-row" key={item.id}>
                <div><strong>{item.title || `Gallery item #${item.id}`}</strong><p>{item.media_type} · {item.is_active ? 'Active' : 'Inactive'}</p><p className="gallery-url">{item.media_url}</p></div>
                <div className="form-actions"><button type="button" onClick={() => edit(item)}>Edit</button><button type="button" onClick={() => remove(item.id)}>Delete</button></div>
              </article>
            ))}
          </div>}
        </section>
      </section>
    </main>
  );
}
