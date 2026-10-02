import apiClient from './client.js';

export const getGallery = async () => {
  const response = await apiClient.get('/gallery');
  return response.data;
};
