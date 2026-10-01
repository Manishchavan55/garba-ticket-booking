import { Router } from 'express';
import { getEvent, listEvents, listTicketCategories } from '../controllers/event.controller.js';
import { validateEventId, validateEventRouteId } from '../validation/event.validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(listEvents));
router.get('/:id', validateEventId, asyncHandler(getEvent));
router.get('/:eventId/ticket-categories', validateEventRouteId, asyncHandler(listTicketCategories));

export default router;
