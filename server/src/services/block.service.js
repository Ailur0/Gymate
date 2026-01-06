import prisma from '../lib/prisma.js';
import { mapUserToProfile } from '../utils/profile.js';

const buildCompositeKey = ({ blockerId, blockedId }) => ({
  blockerId_blockedId: {
    blockerId,
    blockedId,
  },
});

const mapBlockRecord = (block) => {
  if (!block) return null;
  return {
    id: block.id,
    blockedUserId: block.blockedId,
    blockerId: block.blockerId,
    createdAt: block.createdAt,
    blockedUser: block.blocked ? mapUserToProfile(block.blocked) : null,
  };
};

export const createBlock = async ({ blockerId, blockedId }) => {
  if (!blockerId || !blockedId) {
    const error = new Error('Both blockerId and blockedId are required');
    error.code = 'BLOCK_IDS_REQUIRED';
    throw error;
  }

  if (blockerId === blockedId) {
    const error = new Error('You cannot block yourself');
    error.code = 'BLOCK_SELF_NOT_ALLOWED';
    throw error;
  }

  const block = await prisma.block.upsert({
    where: buildCompositeKey({ blockerId, blockedId }),
    update: {},
    create: {
      blockerId,
      blockedId,
    },
    include: {
      blocked: true,
    },
  });

  return mapBlockRecord(block);
};

export const deleteBlock = async ({ blockerId, blockedId }) => {
  if (!blockerId || !blockedId) {
    const error = new Error('Both blockerId and blockedId are required');
    error.code = 'BLOCK_IDS_REQUIRED';
    throw error;
  }

  try {
    await prisma.block.delete({
      where: buildCompositeKey({ blockerId, blockedId }),
    });
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
};

export const listBlocksForUser = async (blockerId) => {
  if (!blockerId) {
    return [];
  }

  const blocks = await prisma.block.findMany({
    where: { blockerId },
    include: {
      blocked: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return blocks.map((block) => mapBlockRecord(block));
};

export const isEitherUserBlocked = async (userId, otherUserId) => {
  if (!userId || !otherUserId) {
    return false;
  }

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
  });

  return Boolean(block);
};

export const getBlockedRelationsForUser = async (userId) => {
  if (!userId) {
    return {
      blockedUserIds: [],
      blockedByUserIds: [],
    };
  }

  const [blocked, blockedBy] = await Promise.all([
    prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
  ]);

  return {
    blockedUserIds: blocked.map((entry) => entry.blockedId),
    blockedByUserIds: blockedBy.map((entry) => entry.blockerId),
  };
};
