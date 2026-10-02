import apiClient from './client.js';

export const listAdminQrTickets = async () => (await apiClient.get('/admin/qr-tickets')).data;
export const getAdminQrTicket = async (ticketId) => (await apiClient.get(`/admin/qr-tickets/${encodeURIComponent(ticketId)}`)).data;
export const verifyVenueQr = async (qrIdentifier) => (await apiClient.post('/admin/qr-tickets/verify', { qrIdentifier })).data;
