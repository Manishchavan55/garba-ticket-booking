import { sendSuccess } from '../utils/response.js';
import { getAdminBooking, listAdminBookings } from '../services/adminBooking.service.js';

export const listBookings = async (_req, res) => {
  sendSuccess(res, await listAdminBookings());
};

export const getBooking = async (req, res) => {
  sendSuccess(res, await getAdminBooking(req.params.bookingId));
};
