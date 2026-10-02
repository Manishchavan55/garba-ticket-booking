import apiClient from './client.js';

export const listAdminGallery = async () => apiClient.get('/admin/gallery');
export const getAdminGallery = async (id) => apiClient.get(`/admin/gallery/${id}`);
export const createAdminGallery = async (payload) => apiClient.post('/admin/gallery', payload);
export const updateAdminGallery = async (id, payload) => apiClient.patch(`/admin/gallery/${id}`, payload);
export const deleteAdminGallery = async (id) => apiClient.delete(`/admin/gallery/${id}`);
