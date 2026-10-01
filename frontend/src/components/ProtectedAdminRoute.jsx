import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext.jsx';

export default function ProtectedAdminRoute() {
  const { loading, isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <main className="page-shell"><p className="status-message">Checking administrator session…</p></main>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
