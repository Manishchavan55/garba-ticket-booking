import { sendSuccess } from '../utils/response.js';
import { getAdminPayment, listAdminPayments } from '../services/adminPayment.service.js';

export const listPayments = async (_req, res) => {
  sendSuccess(res, await listAdminPayments());
};

export const getPayment = async (req, res) => {
  sendSuccess(res, await getAdminPayment(req.params.paymentId));
};
