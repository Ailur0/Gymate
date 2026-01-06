import { Router } from 'express';
import { getProfile, listProfiles, upsertProfile, updateLocation } from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, listProfiles);
router.get('/:id', authenticate, getProfile);
router.post('/', authenticate, upsertProfile);
router.put('/:id', authenticate, upsertProfile);
router.post('/location/update', authenticate, updateLocation);

export default router;
