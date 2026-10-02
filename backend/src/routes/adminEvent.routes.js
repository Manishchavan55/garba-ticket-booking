import { Router } from 'express';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createEvent,
  createTicketCategory,
  deleteEvent,
  deleteTicketCategory,
  getEvent,
  listEvents,
  listTicketCategories,
  updateEvent,
  updateTicketCategory,
} from '../controllers/adminEvent.controller.js';
import {
  validateAdminCategoryBody,
  validateAdminEventBody,
  validateAdminEventId,
  validateAdminEventRouteId,
  validateAdminTicketCategoryId,
} from '../validation/adminEvent.validation.js';

const router = Router();
const adminOnly = [authenticateAdmin, authorizeAdmin()];

router.get('/events', ...adminOnly, asyncHandler(listEvents));
router.get('/events/:id', ...adminOnly, validateAdminEventId, asyncHandler(getEvent));
router.post('/events', ...adminOnly, validateAdminEventBody, asyncHandler(createEvent));
router.patch('/events/:id', ...adminOnly, validateAdminEventId, validateAdminEventBody, asyncHandler(updateEvent));
router.delete('/events/:id', ...adminOnly, validateAdminEventId, asyncHandler(deleteEvent));

router.get('/events/:eventId/ticket-categories', ...adminOnly, validateAdminEventRouteId, asyncHandler(listTicketCategories));
router.post('/events/:eventId/ticket-categories', ...adminOnly, validateAdminEventRouteId, validateAdminCategoryBody, asyncHandler(createTicketCategory));
router.patch('/ticket-categories/:id', ...adminOnly, validateAdminTicketCategoryId, validateAdminCategoryBody, asyncHandler(updateTicketCategory));
router.delete('/ticket-categories/:id', ...adminOnly, validateAdminTicketCategoryId, asyncHandler(deleteTicketCategory));

export default router;
