import crypto from 'crypto';

import prisma from '../lib/prisma.js';
import { ensureRedisConnection } from '../lib/redis.js';
import { mapUserToProfile } from '../utils/profile.js';
import { getSeenUserIds } from './swipeHistory.service.js';
import { getBlockedRelationsForUser } from './block.service.js';
import { getSignalForUsers } from './userSignal.service.js';

const DEFAULT_QUEUE_LIMIT = Number(process.env.SWIPE_QUEUE_LIMIT || 20);
const MAX_QUEUE_LIMIT = 100;
const DEFAULT_MATCH_RADIUS_KM = Number(process.env.DEFAULT_MATCH_RADIUS_KM || 5);
const MIN_COMPATIBILITY_SCORE = Number(process.env.MIN_COMPATIBILITY_SCORE || 0.6);
const QUEUE_CACHE_TTL_SECONDS = Number(process.env.SWIPE_QUEUE_CACHE_TTL_SECONDS || 300);
const CACHE_REGISTRY_PREFIX = 'swipe:cachekeys';

const FITNESS_LEVEL_ORDER = ['Beginner', 'Intermediate', 'Advanced'];

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (locA, locB) => {
  if (!locA?.lat || !locA?.lng || !locB?.lat || !locB?.lng) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = toRadians(locB.lat - locA.lat);
  const dLon = toRadians(locB.lng - locA.lng);
  const lat1 = toRadians(locA.lat);
  const lat2 = toRadians(locB.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const normalizeScore = (value, weight) => value * weight;

const computeLocationScore = ({ distanceKm, radiusKm }) => {
  if (typeof distanceKm !== 'number') {
    return 0.4; // partial credit when location unknown
  }
  if (distanceKm > radiusKm) {
    return 0;
  }
  return 1 - distanceKm / radiusKm;
};

const computeFitnessScore = (userLevel, candidateLevel) => {
  if (!userLevel || !candidateLevel) return 0.5;
  const diff = Math.abs(
    FITNESS_LEVEL_ORDER.indexOf(userLevel) - FITNESS_LEVEL_ORDER.indexOf(candidateLevel),
  );
  if (diff <= 0) return 1;
  if (diff === 1) return 0.7;
  return 0.3;
};

const computeOverlapScore = (arrA = [], arrB = [], minShared = 1) => {
  if (!arrA.length || !arrB.length) {
    return 0.3;
  }
  const shared = arrA.filter((value) => arrB.includes(value));
  return Math.min(1, shared.length / Math.max(minShared, 1));
};

const computeGoalScore = (goalA, goalB) => {
  if (!goalA || !goalB) return 0.4;
  return goalA === goalB ? 1 : 0.5;
};

const scoreCandidate = ({ userProfile, candidateProfile, radiusKm, signal }) => {
  const weights = {
    location: 0.4,
    fitness: 0.2,
    schedule: 0.15,
    interests: 0.15,
    goals: 0.1,
  };

  const distanceKm = calculateDistanceKm(userProfile.location, candidateProfile.location);
  const locationScore = computeLocationScore({ distanceKm, radiusKm });
  const fitnessScore = computeFitnessScore(userProfile.fitnessLevel, candidateProfile.fitnessLevel);
  const scheduleScore = computeOverlapScore(userProfile.workoutTimes, candidateProfile.workoutTimes, 2);
  const interestScore = computeOverlapScore(userProfile.interests, candidateProfile.interests, 2);
  const goalScore = computeGoalScore(userProfile.primaryGoal, candidateProfile.primaryGoal);

  let total =
    normalizeScore(locationScore, weights.location) +
    normalizeScore(fitnessScore, weights.fitness) +
    normalizeScore(scheduleScore, weights.schedule) +
    normalizeScore(interestScore, weights.interests) +
    normalizeScore(goalScore, weights.goals);

  if (signal) {
    const promptCount = signal.promptCount || 0;
    const responseCount = signal.responseCount || 0;
    const negativeFlags = signal.negativeFlags || 0;
    const responseRate = promptCount > 0 ? responseCount / promptCount : 0;

    if (responseRate >= 0.6 && responseCount >= 5) {
      total += 0.05;
    }

    if (negativeFlags >= 2) {
      total -= Math.min(0.1, negativeFlags * 0.03);
    }
  }

  return Number(total.toFixed(3));
};

const applyFilters = ({ candidate, radiusKm, distanceKm, filters }) => {
  if (filters?.gender && candidate.gender && candidate.gender !== filters.gender) {
    return false;
  }

  if (filters?.fitnessLevels?.length && candidate.fitnessLevel) {
    if (!filters.fitnessLevels.includes(candidate.fitnessLevel)) {
      return false;
    }
  }

  if (typeof distanceKm === 'number' && distanceKm > radiusKm) {
    return false;
  }

  return true;
};

const buildCacheSetKey = (userId) => `${CACHE_REGISTRY_PREFIX}:${userId}`;

const buildQueueCacheKey = (userId, payload) =>
  `swipe:queue:${userId}:${crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex')}`;

const rememberCacheKey = async (userId, cacheKey, redisClient) => {
  if (!userId || !cacheKey) {
    return;
  }
  const redis = redisClient || (await ensureRedisConnection());
  const registryKey = buildCacheSetKey(userId);
  await redis.sadd(registryKey, cacheKey);
  if (QUEUE_CACHE_TTL_SECONDS > 0) {
    await redis.expire(registryKey, QUEUE_CACHE_TTL_SECONDS);
  }
};

export const clearSwipeQueueCacheForUser = async (userId) => {
  if (!userId) {
    return;
  }
  const redis = await ensureRedisConnection();
  const registryKey = buildCacheSetKey(userId);
  const keys = await redis.smembers(registryKey);
  if (keys?.length) {
    await redis.del(...keys);
  }
  await redis.del(registryKey);
};

export const getSwipeQueueForUser = async ({
  userId,
  limit = DEFAULT_QUEUE_LIMIT,
  filters = {},
}) => {
  if (!userId) {
    const error = new Error('User ID required');
    error.code = 'USER_REQUIRED';
    throw error;
  }

  const radiusKm = Number(filters.radiusKm || DEFAULT_MATCH_RADIUS_KM);
  const minScore = Number(filters.minScore || MIN_COMPATIBILITY_SCORE);
  const fitnessLevels = filters.fitnessLevels?.filter(Boolean).sort();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  const [{ blockedUserIds, blockedByUserIds }, seenIds] = await Promise.all([
    getBlockedRelationsForUser(userId),
    getSeenUserIds(userId),
  ]);

  const excludedIds = new Set([userId, ...(seenIds || []), ...(blockedUserIds || []), ...(blockedByUserIds || [])]);

  const fetchLimit = Math.min(limit ?? DEFAULT_QUEUE_LIMIT, MAX_QUEUE_LIMIT);
  const seedBatchSize = fetchLimit * 4; // fetch extra to allow filtering

  const cacheKeyFilters = {
    radiusKm,
    minScore,
    gender: filters.gender || null,
    fitnessLevels,
  };
  const cachePayload = { limit: fetchLimit, filters: cacheKeyFilters };
  const cacheKey = buildQueueCacheKey(userId, cachePayload);

  let redisClient = null;
  if (QUEUE_CACHE_TTL_SECONDS > 0) {
    redisClient = await ensureRedisConnection();
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const candidates = await prisma.user.findMany({
    where: {
      id: {
        not: userId,
        notIn: Array.from(excludedIds),
      },
      isSnoozed: false,
    },
    take: seedBatchSize,
  });

  const userProfile = mapUserToProfile(user);

  const candidateSignals = await getSignalForUsers(candidates.map((candidate) => candidate.id));

  const scored = candidates
    .map((candidate) => {
      const profile = mapUserToProfile(candidate);
      const distanceKm = calculateDistanceKm(userProfile.location, profile.location);
      const signal = candidateSignals[candidate.id];
      return {
        profile,
        distanceKm,
        signal,
      };
    })
    .filter(({ profile, distanceKm }) =>
      applyFilters({ candidate: profile, radiusKm, distanceKm, filters: { ...filters, fitnessLevels } }),
    )
    .map(({ profile, distanceKm, signal }) => ({
      profile,
      distanceKm,
      score: scoreCandidate({ userProfile, candidateProfile: profile, radiusKm, signal }),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, fetchLimit)
    .map(({ profile, score, distanceKm }) => ({
      ...profile,
      compatibilityScore: score,
      distanceKm,
    }));

  if (QUEUE_CACHE_TTL_SECONDS > 0) {
    const redis = redisClient || (await ensureRedisConnection());
    await redis.set(cacheKey, JSON.stringify(scored), 'EX', QUEUE_CACHE_TTL_SECONDS);
    await rememberCacheKey(userId, cacheKey, redis);
  }

  return scored;
};
