import { sendSuccess } from '../utils/response.js';
import {
  getPublicEventById,
  getPublicEvents,
  getPublicTicketCategories,
} from '../services/event.service.js';

const notFound = (resource) => {
  const error = new Error(`${resource} not found`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  return error;
};

export const listEvents = async (_req, res) => {
  const events = await getPublicEvents();
  sendSuccess(res, events);
};

export const getEvent = async (req, res) => {
  const event = await getPublicEventById(req.params.id);

  if (!event) {
    throw notFound('Event');
  }

  sendSuccess(res, event);
};

export const listTicketCategories = async (req, res) => {
  const event = await getPublicEventById(req.params.eventId);

  if (!event) {
    throw notFound('Event');
  }

  const categories = await getPublicTicketCategories(req.params.eventId);
  sendSuccess(res, categories);
};
