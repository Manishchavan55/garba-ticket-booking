import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext.jsx';

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
        <p className="eyebrow">Protected administration area</p>
        <h1 id="admin-foundation-heading">Admin management</h1>
        <p className="muted-copy">Manage event configuration, review customer bookings and payment transactions, and operate QR ticket verification using the existing authenticated admin session.</p>
        <div className="booking-actions">
          <button type="button" onClick={() => navigate('/admin/events')}>Events &amp; ticket categories</button>
          <button type="button" onClick={() => navigate('/admin/bookings')}>Bookings</button>
          <button type="button" onClick={() => navigate('/admin/payments')}>Payments &amp; transactions</button>
          <button type="button" onClick={() => navigate('/admin/qr')}>QR venue operations</button>
        </div>
        <dl className="admin-identity">
          <div>
            <dt>Username</dt>
            <dd>{admin.username}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{admin.email}</dd>
          </div>
          <div>
            <dt>Session expires</dt>
            <dd>{new Date(expiresAt).toLocaleString()}</dd>
          </div>
        </dl>
        <button type="button" onClick={handleLogout}>Sign out</button>
      </section>
    </main>
  );
}
