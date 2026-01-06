import { Router } from 'express';
import { createMatch, listMatches } from '../controllers/match.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, listMatches);
router.post('/', authenticate, createMatch);

export default router;
