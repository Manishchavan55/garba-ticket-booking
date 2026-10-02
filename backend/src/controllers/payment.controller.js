import { sendSuccess } from '../utils/response.js';
import { initiatePayment, verifyPayment, processWebhook } from '../services/payment.service.js';

export const initiate = async (req, res) => {
  const result = await initiatePayment(req.params.bookingId, req.paymentIdempotencyKey);
  sendSuccess(res, result, result.reused ? 200 : 201);
};

export const verify = async (req, res) => {
  const result = await verifyPayment(req.body.bookingId, req.body.providerPayload ?? req.body);
  sendSuccess(res, result);
};

export const webhook = async (req, res) => {
  const result = await processWebhook(req.body, undefined, {
    headers: req.headers,
    rawBody: req.rawBody,
  });
  sendSuccess(res, result);
};
