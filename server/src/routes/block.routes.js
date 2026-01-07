import { Router } from 'express';
import { listBlocks, blockUser, unblockUser } from '../controllers/block.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, listBlocks);
router.post('/', authenticate, blockUser);
router.delete('/:blockedUserId', authenticate, unblockUser);

export default router;
