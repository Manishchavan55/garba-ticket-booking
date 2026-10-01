import { getHealthStatus, getReadinessStatus } from '../services/health.service.js';
import { sendSuccess } from '../utils/response.js';

export const health = (_req, res) => {
  sendSuccess(res, getHealthStatus());
};

export const readiness = async (_req, res) => {
  const status = await getReadinessStatus();
  sendSuccess(res, status);
};
