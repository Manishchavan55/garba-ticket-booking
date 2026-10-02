import { sendSuccess } from '../utils/response.js';
import {
  createAdminEvent,
  createAdminTicketCategory,
  deleteAdminEvent,
  deleteAdminTicketCategory,
  getAdminEvent,
  listAdminEvents,
  listAdminTicketCategories,
  updateAdminEvent,
  updateAdminTicketCategory,
} from '../services/adminEvent.service.js';

export const listEvents = async (_req, res) => {
  sendSuccess(res, await listAdminEvents());
};

export const getEvent = async (req, res) => {
  sendSuccess(res, await getAdminEvent(req.params.id));
};

export const createEvent = async (req, res) => {
  sendSuccess(res, await createAdminEvent(req.body), 201);
};

export const updateEvent = async (req, res) => {
  sendSuccess(res, await updateAdminEvent(req.params.id, req.body));
};

export const deleteEvent = async (req, res) => {
  await deleteAdminEvent(req.params.id);
  sendSuccess(res, { deleted: true });
};

export const listTicketCategories = async (req, res) => {
  sendSuccess(res, await listAdminTicketCategories(req.params.eventId));
};

export const createTicketCategory = async (req, res) => {
  sendSuccess(res, await createAdminTicketCategory(req.params.eventId, req.body), 201);
};

export const updateTicketCategory = async (req, res) => {
  sendSuccess(res, await updateAdminTicketCategory(req.params.id, req.body));
};

export const deleteTicketCategory = async (req, res) => {
  await deleteAdminTicketCategory(req.params.id);
  sendSuccess(res, { deleted: true });
};
