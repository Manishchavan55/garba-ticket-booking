import { Router } from 'express';
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

export default router;
