import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext.jsx';

const adminSections = [
  ['events', 'Events & ticket categories', 'Configure event information and ticket pricing.'],
  ['bookings', 'Bookings', 'Review customer bookings and their lifecycle status.'],
  ['payments', 'Payments & transactions', 'Review payment records and provider references.'],
  ['qr', 'QR venue operations', 'Validate issued tickets and venue entry state.'],
  ['gallery', 'Gallery management', 'Manage published media for the public gallery.'],
  ['sponsors', 'Sponsor management', 'Manage active and inactive sponsor records.'],
  ['inquiries', 'Contact inquiries', 'Review and manage incoming customer inquiries.'],
];

export default function AdminHomePage() {
  const { admin, expiresAt, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <main className="page-shell admin-home-page">
      <section className="admin-auth-card" aria-labelledby="admin-foundation-heading">
        <p className="eyebrow">KESARIYA control room</p>
        <h1 id="admin-foundation-heading">Event operations, in one place.</h1>
        <p className="muted-copy">Manage the published event experience, customer activity, payments, venue verification, and content records from the authenticated administration area.</p>

        <div className="admin-dashboard-grid" aria-label="Admin modules">
          {adminSections.map(([slug, title, description]) => (
            <button className="admin-module-card" type="button" key={slug} onClick={() => navigate(`/admin/${slug}`)}>
              <span className="admin-module-card__kicker">Manage</span>
              <strong>{title}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>

        <dl className="admin-identity">
          <div><dt>Username</dt><dd>{admin.username}</dd></div>
          <div><dt>Email</dt><dd>{admin.email}</dd></div>
          <div><dt>Session expires</dt><dd>{new Date(expiresAt).toLocaleString()}</dd></div>
        </dl>
        <button type="button" onClick={handleLogout}>Sign out</button>
      </section>
    </main>
  );
}
