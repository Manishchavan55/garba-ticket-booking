import { Router } from 'express';
import { create } from '../controllers/booking.controller.js';
import { validateCreateBooking, validateIdempotencyKey } from '../validation/booking.validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/', validateIdempotencyKey, validateCreateBooking, asyncHandler(create));

export default router;
