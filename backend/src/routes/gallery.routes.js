import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listGallery } from '../controllers/gallery.controller.js';

const router = Router();

router.get('/', asyncHandler(listGallery));

export default router;
