import { Router } from 'express';
import { likeUser, passUser } from '../controllers/like.controller.js';
import { listSwipeQueue } from '../controllers/swipe.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/queue', listSwipeQueue);
router.post('/like', authenticate, likeUser);
router.post('/pass', authenticate, passUser);

export default router;
