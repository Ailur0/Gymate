import prisma from '../lib/prisma.js';
import { mapUserToProfile } from '../utils/profile.js';
import { getBlockedRelationsForUser, isEitherUserBlocked } from './block.service.js';
import { incrementPositiveMatches } from './userSignal.service.js';

const mapMatch = (match, userId) => {
  const partner = match.userAId === userId ? match.userB : match.userA;
  return {
    id: match.id,
    createdAt: match.createdAt,
    lastMessage: match.lastMessage,
    partner: mapUserToProfile(partner),
  };
};

export const listMatchesForUser = async (userId) => {
  const [{ blockedUserIds, blockedByUserIds }, matches] = await Promise.all([
    getBlockedRelationsForUser(userId),
    prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: true,
        userB: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const excludedPartnerIds = new Set([...(blockedUserIds || []), ...(blockedByUserIds || [])]);

  return matches
    .filter((match) => {
      const partnerId = match.userAId === userId ? match.userBId : match.userAId;
      return !excludedPartnerIds.has(partnerId);
    })
    .map((match) => mapMatch(match, userId));
};

export const createMatch = async ({ userId, partnerId }) => {
  const blocked = await isEitherUserBlocked(userId, partnerId);
  if (blocked) {
    const error = new Error('Cannot match with a blocked user');
    error.code = 'USER_BLOCKED';
    throw error;
  }

  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: partnerId },
        { userAId: partnerId, userBId: userId },
      ],
    },
  });

  if (existing) {
    return mapMatch(existing, userId);
  }

  const match = await prisma.match.create({
    data: {
      userAId: userId,
      userBId: partnerId,
    },
    include: {
      userA: true,
      userB: true,
    },
  });

  incrementPositiveMatches(userId).catch(() => {});
  incrementPositiveMatches(partnerId).catch(() => {});

  return mapMatch(match, userId);
};
