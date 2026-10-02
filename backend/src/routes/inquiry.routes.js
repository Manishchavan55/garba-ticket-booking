import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createInquiry } from '../controllers/inquiry.controller.js';
import { validateInquiryBody } from '../validation/inquiry.validation.js';

const router = Router();
router.post('/', validateInquiryBody, asyncHandler(createInquiry));

export default router;
