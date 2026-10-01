import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verify } from '../controllers/ticket.controller.js';
import { validateQrVerificationPayload } from '../validation/ticket.validation.js';

const router = Router();

router.post('/verify', validateQrVerificationPayload, asyncHandler(verify));

export default router;
