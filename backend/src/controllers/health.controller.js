import { getHealthStatus } from '../services/health.service.js';

export const health = (_req, res) => {
  res.status(200).json(getHealthStatus());
};
