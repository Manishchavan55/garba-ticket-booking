import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createGalleryItem,
  deleteGalleryItem,
  getAdminGalleryItem,
  listAdminGalleryItems,
  updateGalleryItem,
} from '../controllers/gallery.controller.js';
import { validateGalleryBody, validateGalleryId } from '../validation/gallery.validation.js';

const router = Router();
const adminOnly = [authenticateAdmin, authorizeAdmin()];

router.get('/gallery', ...adminOnly, asyncHandler(listAdminGalleryItems));
router.get('/gallery/:id', ...adminOnly, validateGalleryId, asyncHandler(getAdminGalleryItem));
router.post('/gallery', ...adminOnly, validateGalleryBody, asyncHandler(createGalleryItem));
router.patch('/gallery/:id', ...adminOnly, validateGalleryId, validateGalleryBody, asyncHandler(updateGalleryItem));
router.delete('/gallery/:id', ...adminOnly, validateGalleryId, asyncHandler(deleteGalleryItem));

export default router;
