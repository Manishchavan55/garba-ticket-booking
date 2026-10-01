import { sendSuccess } from '../utils/response.js';
import { createBooking } from '../services/booking.service.js';

export const create = async (req, res) => {
  const booking = await createBooking(req.body, req.idempotencyKey);

  sendSuccess(res, {
    bookingId: booking.bookingId,
    status: booking.status,
    amount: booking.amount,
    currency: booking.currency,
  }, booking.reused ? 200 : 201);
};
