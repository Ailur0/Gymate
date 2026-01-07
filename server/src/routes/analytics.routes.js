import { Router } from 'express';
import { authenticate, requireModerator } from '../middleware/auth.middleware.js';
import { summarizeSignals } from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate, requireModerator);
router.get('/signals', summarizeSignals);

export default router;
