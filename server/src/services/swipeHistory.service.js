import { ensureRedisConnection } from '../lib/redis.js';

const SEEN_TTL_SECONDS = Number(
  process.env.SWIPE_SEEN_TTL_SECONDS || Number(process.env.SWIPE_SEEN_TTL_DAYS || 7) * 24 * 60 * 60,
);

const buildSeenKey = (userId) => `swipe:seen:${userId}`;

const ensureSeenExpiry = async (redis, key) => {
  if (SEEN_TTL_SECONDS <= 0) {
    return;
  }
  const ttl = await redis.ttl(key);
  if (ttl === -1 || ttl === -2) {
    await redis.expire(key, SEEN_TTL_SECONDS);
  }
};

export const markUserAsSeen = async ({ userId, targetUserId }) => {
  if (!userId || !targetUserId) {
    return;
  }
  const redis = await ensureRedisConnection();
  const key = buildSeenKey(userId);
  await redis.sadd(key, targetUserId);
  await ensureSeenExpiry(redis, key);
};

export const getSeenUserIds = async (userId) => {
  if (!userId) {
    return [];
  }
  const redis = await ensureRedisConnection();
  const members = await redis.smembers(buildSeenKey(userId));
  return members || [];
};

export const clearSeenCache = async (userId) => {
  if (!userId) {
    return;
  }
  const redis = await ensureRedisConnection();
  await redis.del(buildSeenKey(userId));
};
