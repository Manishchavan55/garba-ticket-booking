import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { initiate, verify, webhook } from '../controllers/payment.controller.js';
import {
  validatePaymentBookingId,
  requirePaymentIdempotencyKey,
  requirePaymentVerificationPayload,
  requirePaymentWebhookPayload,
} from '../validation/payment.validation.js';

const router = Router();

router.post(
  '/bookings/:bookingId/payment',
  validatePaymentBookingId,
  requirePaymentIdempotencyKey,
  asyncHandler(initiate),
);

router.post(
  '/payments/verify',
  requirePaymentVerificationPayload,
  asyncHandler(verify),
);

router.post(
  '/payments/webhook',
  requirePaymentWebhookPayload,
  asyncHandler(webhook),
);

export default router;
