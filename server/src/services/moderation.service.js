import prisma from '../lib/prisma.js';

const DEFAULT_KEYWORDS = ['scam', 'fraud', 'meet alone', 'cash app', 'crypto'];

export const recordKeywordScan = async ({ targetType, targetId, text, keywords = DEFAULT_KEYWORDS }) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  const hits = keywords
    .filter((keyword) => lower.includes(keyword.toLowerCase()))
    .map((keyword) => keyword.toLowerCase());
  if (!hits.length) {
    return null;
  }

  return prisma.moderationItem.create({
    data: {
      targetType,
      targetId,
      status: 'PENDING',
      keywordHits: hits.join(', '),
      reason: 'KEYWORD_FILTER',
    },
  });
};

export const createModerationItem = async ({ targetType, targetId, reason, metadata }) => {
  return prisma.moderationItem.create({
    data: {
      targetType,
      targetId,
      reason,
      metadata,
    },
  });
};

export const listModerationItems = async ({ status = 'PENDING', limit = 50 }) => {
  return prisma.moderationItem.findMany({
    where: { status },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
};

export const resolveModerationItem = async ({ id, status, moderatorId }) => {
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    const error = new Error('Invalid moderation status');
    error.code = 'INVALID_STATUS';
    throw error;
  }

  const item = await prisma.moderationItem.update({
    where: { id },
    data: {
      status,
      resolvedAt: new Date(),
      resolvedById: moderatorId,
    },
  });
  return item;
};
