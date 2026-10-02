import apiClient from './client.js';

export const listAdminSponsors = async () => apiClient.get('/admin/sponsors');
export const getAdminSponsor = async (id) => apiClient.get(`/admin/sponsors/${id}`);
export const createAdminSponsor = async (payload) => apiClient.post('/admin/sponsors', payload);
export const updateAdminSponsor = async (id, payload) => apiClient.patch(`/admin/sponsors/${id}`, payload);
export const deleteAdminSponsor = async (id) => apiClient.delete(`/admin/sponsors/${id}`);
