import { Router } from 'express';
import eventRoutes from './event.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/events', eventRoutes);

export default router;
