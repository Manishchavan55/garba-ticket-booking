import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAdminSession, loginAdmin, logoutAdmin } from '../api/adminAuth.js';

const AdminAuthContext = createContext(null);

const getErrorMessage = (error, fallback) => error?.response?.data?.error?.message ?? fallback;

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getAdminSession()
      .then((session) => {
        if (active) {
          setAdmin(session.admin);
          setExpiresAt(session.expiresAt);
        }
      })
      .catch(() => {
        if (active) {
          setAdmin(null);
          setExpiresAt(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    admin,
    expiresAt,
    loading,
    isAuthenticated: Boolean(admin),
    login: async (identifier, password) => {
      try {
        const session = await loginAdmin(identifier, password);
        setAdmin(session.admin);
        setExpiresAt(session.expiresAt);
        return session;
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Unable to sign in'));
      }
    },
    logout: async () => {
      try {
        await logoutAdmin();
      } finally {
        setAdmin(null);
        setExpiresAt(null);
      }
    },
  }), [admin, expiresAt, loading]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};
