import { Router } from 'express';
import { login, logout, me } from '../controllers/adminAuth.controller.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { authorizeAdmin } from '../middleware/adminAuthorization.js';
import { requireSameOrigin } from '../middleware/csrf.js';
import { checkAdminLoginRateLimit } from '../middleware/adminRateLimit.js';
import { validateBody } from '../validation/requestValidation.js';
import { validateAdminLogin } from '../validation/adminAuth.validation.js';

const router = Router();

router.post('/login', requireSameOrigin, checkAdminLoginRateLimit, validateBody(validateAdminLogin), login);
router.post('/logout', requireSameOrigin, logout);
router.get('/me', authenticateAdmin, authorizeAdmin(), me);

export default router;
