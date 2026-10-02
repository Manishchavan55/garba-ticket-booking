import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPayment, listPayments } from '../controllers/adminPayment.controller.js';
import { validateAdminPaymentId } from '../validation/adminPayment.validation.js';

const router = Router();
const adminOnly = [authenticateAdmin, authorizeAdmin()];

router.get('/payments', ...adminOnly, asyncHandler(listPayments));
router.get('/payments/:paymentId', ...adminOnly, validateAdminPaymentId, asyncHandler(getPayment));

export default router;
