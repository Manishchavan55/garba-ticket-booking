import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
  timeout: 5000,
});

export async function getHealth() {
  const response = await api.get('/api/health');
  return response.data;
}

export default api;
