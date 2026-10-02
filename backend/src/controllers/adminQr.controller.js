import { sendSuccess } from '../utils/response.js';
import { getAdminQrTicket, listAdminQrTickets } from '../services/adminQr.service.js';
import { verifyQrTicket } from '../services/ticket.service.js';

export const listQrTickets = async (_req, res) => {
  sendSuccess(res, await listAdminQrTickets());
};

export const getQrTicket = async (req, res) => {
  sendSuccess(res, await getAdminQrTicket(req.params.ticketId));
};

export const verifyVenueQr = async (req, res) => {
  sendSuccess(res, await verifyQrTicket(req.body.qrIdentifier));
};
