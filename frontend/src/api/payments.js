import apiClient from './client.js';

export const initiatePayment = async (bookingId, idempotencyKey) => {
  const response = await apiClient.post(`/bookings/${encodeURIComponent(bookingId)}/payment`, null, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });

  return response.data.data;
};

export const verifyPayment = async (bookingId, providerPayload) => {
  const response = await apiClient.post('/payments/verify', {
    bookingId,
    providerPayload,
  });

  return response.data.data;
};
