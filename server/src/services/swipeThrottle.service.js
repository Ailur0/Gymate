import { ensureRedisConnection } from '../lib/redis.js';

const FREE_LIKE_DAILY_LIMIT = Number(process.env.FREE_LIKE_DAILY_LIMIT || 50);
const FREE_SUPERLIKE_DAILY_LIMIT = Number(process.env.FREE_SUPERLIKE_DAILY_LIMIT || 5);

const buildDayStamp = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const secondsUntilEndOfDay = () => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 1000));
};

const buildKey = (type, userId) => `swipe:${type}:${buildDayStamp()}:${userId}`;

const ensureExpiry = async (redis, key) => {
  const ttl = await redis.ttl(key);
  if (ttl === -1 || ttl === -2) {
    await redis.expire(key, secondsUntilEndOfDay());
  }
};

const incrementKey = async (redis, key) => {
  const value = await redis.incr(key);
  if (value === 1) {
    await redis.expire(key, secondsUntilEndOfDay());
  }
  return value;
};

const buildLimitError = ({ type, resetsAt }) => {
  const error = new Error(`Daily ${type} limit reached`);
  error.code = 'SWIPE_LIMIT_REACHED';
  error.meta = { type, resetsAt };
  return error;
};

const getResetsAtFromTtl = (ttlSeconds) => {
  const ttl = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : secondsUntilEndOfDay();
  return new Date(Date.now() + ttl * 1000).toISOString();
};

export const getThrottleSnapshot = async (userId, redisClient) => {
  if (!userId) {
    return null;
  }

  const redis = redisClient || (await ensureRedisConnection());
  const likeKey = buildKey('likes', userId);
  const superKey = buildKey('superlikes', userId);

  await Promise.all([ensureExpiry(redis, likeKey), ensureExpiry(redis, superKey)]);

  const [likesRaw, superRaw, ttl] = await Promise.all([
    redis.get(likeKey),
    redis.get(superKey),
    redis.ttl(likeKey),
  ]);

  return {
    remainingLikes: Math.max(FREE_LIKE_DAILY_LIMIT - Number(likesRaw || 0), 0),
    remainingSuperLikes: Math.max(FREE_SUPERLIKE_DAILY_LIMIT - Number(superRaw || 0), 0),
    limits: {
      likes: FREE_LIKE_DAILY_LIMIT,
      superLikes: FREE_SUPERLIKE_DAILY_LIMIT,
    },
    resetsAt: getResetsAtFromTtl(ttl),
  };
};

export const incrementSwipeUsage = async ({ userId, superLike = false }) => {
  if (!userId) {
    throw new Error('User ID is required for throttling');
  }

  const redis = await ensureRedisConnection();
  const likeKey = buildKey('likes', userId);
  const superKey = buildKey('superlikes', userId);

  await Promise.all([ensureExpiry(redis, likeKey), ensureExpiry(redis, superKey)]);

  const currentLikes = Number((await redis.get(likeKey)) || 0);
  if (FREE_LIKE_DAILY_LIMIT > 0 && currentLikes >= FREE_LIKE_DAILY_LIMIT) {
    throw buildLimitError({ type: 'likes', resetsAt: getResetsAtFromTtl(await redis.ttl(likeKey)) });
  }

  const currentSuperLikes = Number((await redis.get(superKey)) || 0);
  if (superLike && FREE_SUPERLIKE_DAILY_LIMIT > 0 && currentSuperLikes >= FREE_SUPERLIKE_DAILY_LIMIT) {
    throw buildLimitError({ type: 'superLikes', resetsAt: getResetsAtFromTtl(await redis.ttl(superKey)) });
  }

  await incrementKey(redis, likeKey);
  if (superLike) {
    await incrementKey(redis, superKey);
  }

  return getThrottleSnapshot(userId, redis);
};
