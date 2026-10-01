import apiClient from './client.js';

export const getEvents = async () => {
  const response = await apiClient.get('/events');
  return response.data.data;
};

export const getEvent = async (eventId) => {
  const response = await apiClient.get(`/events/${eventId}`);
  return response.data.data;
};

export const getTicketCategories = async (eventId) => {
  const response = await apiClient.get(`/events/${eventId}/ticket-categories`);
  return response.data.data;
};
