import { ensureRedisConnection } from '../lib/redis.js';

const TYPING_TTL_SECONDS = Number(process.env.CHAT_TYPING_TTL_SECONDS || 5);

const buildTypingKey = (matchId) => `chat:typing:${matchId}`;

export const setTypingState = async ({ matchId, userId, isTyping }) => {
  if (!matchId || !userId) {
    return;
  }
  const redis = await ensureRedisConnection();
  const key = buildTypingKey(matchId);
  if (isTyping) {
    await redis.hset(key, userId, Date.now().toString());
    await redis.expire(key, TYPING_TTL_SECONDS * 2);
  } else {
    await redis.hdel(key, userId);
  }
};

export const getTypingUsers = async (matchId) => {
  if (!matchId) {
    return [];
  }
  const redis = await ensureRedisConnection();
  const entries = await redis.hgetall(buildTypingKey(matchId));
  const now = Date.now();
  return Object.entries(entries || {})
    .filter(([, timestamp]) => now - Number(timestamp) <= TYPING_TTL_SECONDS * 1000)
    .map(([userId]) => userId);
};
