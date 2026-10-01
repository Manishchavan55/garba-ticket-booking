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
        <h1 id="admin-foundation-heading">Admin authentication foundation</h1>
        <p className="muted-copy">Authentication is active. Business administration modules will be introduced in later phases.</p>
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
