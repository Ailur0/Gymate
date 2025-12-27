import { requestOtpForPhone, verifyOtpForPhone } from '../services/auth.service.js';

export const requestOtp = async (req, res, next) => {
  try {
    const { phone, countryCode } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const result = await requestOtpForPhone({ phone, countryCode });
    return res.json({ message: 'OTP sent', ...result });
  } catch (error) {
    return next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const result = await verifyOtpForPhone({ phone, otp });
    return res.json(result);
  } catch (error) {
    if (error.code === 'INVALID_OTP' || error.code === 'OTP_EXPIRED') {
      return res.status(401).json({ message: error.message });
    }
    return next(error);
  }
};
