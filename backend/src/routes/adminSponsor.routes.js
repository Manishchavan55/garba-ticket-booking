import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createSponsorItem,
  deleteSponsorItem,
  getAdminSponsorItem,
  listAdminSponsorItems,
  updateSponsorItem,
} from '../controllers/sponsor.controller.js';
import { validateSponsorBody, validateSponsorId } from '../validation/sponsor.validation.js';

const router = Router();
const adminOnly = [authenticateAdmin, authorizeAdmin()];

router.get('/sponsors', ...adminOnly, asyncHandler(listAdminSponsorItems));
router.get('/sponsors/:id', ...adminOnly, validateSponsorId, asyncHandler(getAdminSponsorItem));
router.post('/sponsors', ...adminOnly, validateSponsorBody, asyncHandler(createSponsorItem));
router.patch('/sponsors/:id', ...adminOnly, validateSponsorId, validateSponsorBody, asyncHandler(updateSponsorItem));
router.delete('/sponsors/:id', ...adminOnly, validateSponsorId, asyncHandler(deleteSponsorItem));

export default router;
