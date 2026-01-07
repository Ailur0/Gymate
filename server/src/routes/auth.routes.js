import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/auth.controller.js';

const router = Router();

router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);

export default router;
