import apiClient from './client.js';

export const loginAdmin = async (identifier, password) => {
  const response = await apiClient.post('/admin/auth/login', { identifier, password });
  return response.data.data;
};

export const getAdminSession = async () => {
  const response = await apiClient.get('/admin/auth/me');
  return response.data.data;
};

export const logoutAdmin = async () => {
  const response = await apiClient.post('/admin/auth/logout');
  return response.data.data;
};
