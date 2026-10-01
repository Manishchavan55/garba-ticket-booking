import apiClient from './client.js';

export const createBooking = async ({ idempotencyKey, ...payload }) => {
  const response = await apiClient.post('/bookings', payload, {
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });

  return response.data.data;
};
