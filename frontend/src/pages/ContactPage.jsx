import { useState } from 'react';
import { submitInquiry } from '../api/inquiries.js';

const initialForm = { name: '', email: '', phone: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      await submitInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim(),
      });
      setForm(initialForm);
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to submit your inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell contact-page">
      <section className="admin-auth-card" aria-labelledby="contact-heading">
        <p className="eyebrow">Get in touch</p>
        <h1 id="contact-heading">Contact KESARIYA Dandiya Nights</h1>
        <p className="muted-copy">Send us your question and the event team can review your inquiry.</p>
        {success && <p className="form-success" role="status">Your inquiry has been submitted successfully.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <form className="contact-form" onSubmit={submit} noValidate>
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" name="name" required maxLength="160" autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" required maxLength="254" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <label htmlFor="contact-phone">Phone (optional)</label>
          <input id="contact-phone" name="phone" maxLength="40" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" required maxLength="65535" rows="7" value={form.message} onChange={(e) => update('message', e.target.value)} />
          <button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Send inquiry'}</button>
        </form>
      </section>
    </main>
  );
}
