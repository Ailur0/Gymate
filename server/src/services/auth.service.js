import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import prisma from '../lib/prisma.js';
import { ensureRedisConnection } from '../lib/redis.js';
import { mapUserToProfile } from '../utils/profile.js';

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_RATE_LIMIT_MAX = Number(process.env.OTP_RATE_LIMIT_MAX || 3);
const OTP_RATE_LIMIT_WINDOW = Number(process.env.OTP_RATE_LIMIT_WINDOW || 60); // minutes
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const buildOtpLimiterKey = (phone) => `otp:limit:${phone}`;

export const requestOtpForPhone = async ({ phone, countryCode = '+1' }) => {
  const redis = await ensureRedisConnection();
  const limiterKey = buildOtpLimiterKey(phone);
  const attempts = await redis.incr(limiterKey);

  if (attempts === 1) {
    await redis.expire(limiterKey, OTP_RATE_LIMIT_WINDOW * 60);
  }

  if (attempts > OTP_RATE_LIMIT_MAX) {
    const ttl = await redis.ttl(limiterKey);
    const error = new Error('Too many OTP requests. Try again later.');
    error.code = 'OTP_RATE_LIMITED';
    error.meta = { retryAfterSeconds: ttl };
    throw error;
  }

  const otp = generateOtp();
  const otpSecret = await bcrypt.hash(otp, 10);
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.upsert({
    where: { phone },
    update: { otpSecret, otpExpiry: expiry },
    create: {
      phone,
      countryCode,
      otpSecret,
      otpExpiry: expiry,
    },
  });

  return {
    expiresAt: expiry,
    otp: process.env.NODE_ENV === 'production' ? undefined : otp,
  };
};

export const verifyOtpForPhone = async ({ phone, otp }) => {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.otpSecret || !user.otpExpiry) {
    const error = new Error('Invalid OTP');
    error.code = 'INVALID_OTP';
    throw error;
  }

  if (user.otpExpiry < new Date()) {
    const error = new Error('OTP expired');
    error.code = 'OTP_EXPIRED';
    throw error;
  }

  const isValid = await bcrypt.compare(otp, user.otpSecret);
  if (!isValid) {
    const error = new Error('Invalid OTP');
    error.code = 'INVALID_OTP';
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { phone },
    data: {
      otpSecret: null,
      otpExpiry: null,
    },
  });

  const redis = await ensureRedisConnection();
  await redis.del(buildOtpLimiterKey(phone));

  const token = jwt.sign({ userId: updatedUser.id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: mapUserToProfile(updatedUser),
  };
};
