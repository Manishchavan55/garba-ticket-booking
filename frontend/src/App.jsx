import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles/global.css';
import './styles/adminEvents.css';
import './styles/adminBookings.css';
import './styles/adminPayments.css';
import './styles/adminQr.css';
import { AdminAuthProvider } from './auth/AdminAuthContext.jsx';
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx';
import AdminBookingsPage from './pages/AdminBookingsPage.jsx';
import AdminEventsPage from './pages/AdminEventsPage.jsx';
import AdminHomePage from './pages/AdminHomePage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminPaymentsPage from './pages/AdminPaymentsPage.jsx';
import AdminQrPage from './pages/AdminQrPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import HomePage from './pages/HomePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/book" element={<BookingPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/qr" element={<AdminQrPage />} />
          </Route>
          <Route path="/status" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
