import { Router } from 'express';
import { listMessages, sendMessage, markRead, updateTypingState, reportMessage } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:matchId', authenticate, listMessages);
router.post('/:matchId', authenticate, sendMessage);
router.post('/:matchId/read', authenticate, markRead);
router.post('/:matchId/typing', authenticate, updateTypingState);
router.post('/:matchId/report', authenticate, reportMessage);

export default router;
