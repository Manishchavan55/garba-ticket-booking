import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext.jsx';

export default function AdminLoginPage() {
  const { isAuthenticated, loading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(identifier, password);
      navigate(location.state?.from ?? '/admin', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-login-heading">
        <p className="eyebrow">KESARIYA Dandiya Nights</p>
        <h1 id="admin-login-heading">Administrator sign in</h1>
        <p className="muted-copy">Use your authorized administrator account to access protected administration APIs.</p>

        <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="admin-identifier">Username or email</label>
          <input
            id="admin-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
