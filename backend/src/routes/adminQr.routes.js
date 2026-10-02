import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getQrTicket, listQrTickets, verifyVenueQr } from '../controllers/adminQr.controller.js';
import { validateAdminQrTicketId, validateVenueQrPayload } from '../validation/adminQr.validation.js';

const router = Router();
const adminOnly = [authenticateAdmin, authorizeAdmin()];

router.get('/qr-tickets', ...adminOnly, asyncHandler(listQrTickets));
router.get('/qr-tickets/:ticketId', ...adminOnly, validateAdminQrTicketId, asyncHandler(getQrTicket));
router.post('/qr-tickets/verify', ...adminOnly, validateVenueQrPayload, asyncHandler(verifyVenueQr));

export default router;
