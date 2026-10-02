import apiClient from './client.js';

export const listAdminBookings = async () => (await apiClient.get('/admin/bookings')).data;
export const getAdminBooking = async (bookingId) => (await apiClient.get(`/admin/bookings/${encodeURIComponent(bookingId)}`)).data;
