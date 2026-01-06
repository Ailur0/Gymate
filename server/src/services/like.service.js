import prisma from '../lib/prisma.js';
import { createMatch } from './match.service.js';
import { markUserAsSeen } from './swipeHistory.service.js';
import { clearSwipeQueueCacheForUser } from './swipe.service.js';

const buildLikeKey = (fromUserId, toUserId) => ({
  fromUserId,
  toUserId,
});

export const recordLike = async ({ fromUserId, toUserId, isSuper = false }) => {
  if (fromUserId === toUserId) {
    const error = new Error('You cannot like yourself');
    error.code = 'INVALID_LIKE';
    throw error;
  }

  const like = await prisma.like.upsert({
    where: {
      fromUserId_toUserId: buildLikeKey(fromUserId, toUserId),
    },
    update: {
      isSuper: isSuper ? true : undefined,
    },
    create: {
      fromUserId,
      toUserId,
      isSuper,
    },
  });

  const reciprocal = await prisma.like.findUnique({
    where: {
      fromUserId_toUserId: buildLikeKey(toUserId, fromUserId),
    },
  });

  let match = null;
  if (reciprocal) {
    match = await createMatch({ userId: fromUserId, partnerId: toUserId });
  }

  await markUserAsSeen({ userId: fromUserId, targetUserId: toUserId });
  await clearSwipeQueueCacheForUser(fromUserId);

  return {
    like,
    match,
  };
};

export const recordPass = async ({ fromUserId, toUserId }) => {
  if (fromUserId === toUserId) {
    return { status: 'noop' };
  }

  // For now we simply ensure any existing like is removed; future iterations can log passes.
  await prisma.like.deleteMany({
    where: {
      fromUserId,
      toUserId,
    },
  });

  await markUserAsSeen({ userId: fromUserId, targetUserId: toUserId });
  await clearSwipeQueueCacheForUser(fromUserId);

  return { status: 'passed' };
};
