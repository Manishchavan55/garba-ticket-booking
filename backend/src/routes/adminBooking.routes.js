import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBooking, listBookings } from '../controllers/adminBooking.controller.js';
import { validateAdminBookingId } from '../validation/adminBooking.validation.js';

const router = Router();
const adminOnly = [authenticateAdmin, authorizeAdmin()];

router.get('/bookings', ...adminOnly, asyncHandler(listBookings));
router.get('/bookings/:bookingId', ...adminOnly, validateAdminBookingId, asyncHandler(getBooking));

export default router;
