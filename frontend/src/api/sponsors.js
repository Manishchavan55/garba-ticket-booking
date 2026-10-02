import apiClient from './client.js';

export const listSponsors = async () => apiClient.get('/sponsors');
