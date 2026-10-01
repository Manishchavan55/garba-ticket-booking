import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { validateJsonBody } from './validation/requestValidation.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(validateJsonBody);

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
