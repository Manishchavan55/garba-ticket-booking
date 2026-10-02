import apiClient from './client.js';

export const listAdminInquiries = async () => apiClient.get('/admin/inquiries');
export const getAdminInquiry = async (id) => apiClient.get(`/admin/inquiries/${id}`);
export const updateAdminInquiry = async (id, payload) => apiClient.patch(`/admin/inquiries/${id}`, payload);
export const deleteAdminInquiry = async (id) => apiClient.delete(`/admin/inquiries/${id}`);
