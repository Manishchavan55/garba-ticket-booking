import apiClient from './client.js';

export const listAdminEvents = async () => (await apiClient.get('/admin/events')).data;
export const getAdminEvent = async (eventId) => (await apiClient.get(`/admin/events/${eventId}`)).data;
export const createAdminEvent = async (payload) => (await apiClient.post('/admin/events', payload)).data;
export const updateAdminEvent = async (eventId, payload) => (await apiClient.patch(`/admin/events/${eventId}`, payload)).data;
export const deleteAdminEvent = async (eventId) => (await apiClient.delete(`/admin/events/${eventId}`)).data;
export const listAdminTicketCategories = async (eventId) => (await apiClient.get(`/admin/events/${eventId}/ticket-categories`)).data;
export const createAdminTicketCategory = async (eventId, payload) => (await apiClient.post(`/admin/events/${eventId}/ticket-categories`, payload)).data;
export const updateAdminTicketCategory = async (categoryId, payload) => (await apiClient.patch(`/admin/ticket-categories/${categoryId}`, payload)).data;
export const deleteAdminTicketCategory = async (categoryId) => (await apiClient.delete(`/admin/ticket-categories/${categoryId}`)).data;
