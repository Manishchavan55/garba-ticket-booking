import { Router } from 'express';
import adminAuthRoutes from './adminAuth.routes.js';
import adminBookingRoutes from './adminBooking.routes.js';
import adminEventRoutes from './adminEvent.routes.js';
import adminPaymentRoutes from './adminPayment.routes.js';
import adminQrRoutes from './adminQr.routes.js';
import bookingRoutes from './booking.routes.js';
import eventRoutes from './event.routes.js';
import healthRoutes from './health.routes.js';
import paymentRoutes from './payment.routes.js';
import ticketRoutes from './ticket.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);
router.use('/tickets', ticketRoutes);
router.use('/', paymentRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin', adminEventRoutes);
router.use('/admin', adminBookingRoutes);
router.use('/admin', adminPaymentRoutes);
router.use('/admin', adminQrRoutes);

export default router;
