import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listSponsors } from '../controllers/sponsor.controller.js';

const router = Router();

router.get('/', asyncHandler(listSponsors));

export default router;
