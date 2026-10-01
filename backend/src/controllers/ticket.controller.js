import { sendSuccess } from '../utils/response.js';
import { verifyQrTicket } from '../services/ticket.service.js';

export const verify = async (req, res) => {
  const result = await verifyQrTicket(req.qrIdentifier);
  sendSuccess(res, result);
};
