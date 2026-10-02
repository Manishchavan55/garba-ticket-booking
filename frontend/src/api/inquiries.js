import apiClient from './client.js';

export const submitInquiry = async (payload) => apiClient.post('/inquiries', payload);
