import apiClient from './client.js';

export const listAdminPayments = async () => (await apiClient.get('/admin/payments')).data;
export const getAdminPayment = async (paymentId) => (await apiClient.get(`/admin/payments/${encodeURIComponent(paymentId)}`)).data;
