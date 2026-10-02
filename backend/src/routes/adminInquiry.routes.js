import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteInquiry,
  getInquiry,
  listInquiries,
  updateInquiry,
} from '../controllers/inquiry.controller.js';
import { validateInquiryId, validateInquiryUpdate } from '../validation/inquiry.validation.js';

const router = Router();
const adminOnly = [authenticateAdmin, authorizeAdmin()];

router.get('/inquiries', ...adminOnly, asyncHandler(listInquiries));
router.get('/inquiries/:id', ...adminOnly, validateInquiryId, asyncHandler(getInquiry));
router.patch('/inquiries/:id', ...adminOnly, validateInquiryId, validateInquiryUpdate, asyncHandler(updateInquiry));
router.delete('/inquiries/:id', ...adminOnly, validateInquiryId, asyncHandler(deleteInquiry));

export default router;
