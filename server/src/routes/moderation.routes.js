import { Router } from 'express';
import { listQueue, resolveItem } from '../controllers/moderation.controller.js';
import { authenticate, requireModerator } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireModerator);
router.get('/', listQueue);
router.post('/:id/resolve', resolveItem);

export default router;
