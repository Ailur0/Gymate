import prisma from '../lib/prisma.js';
import { isEitherUserBlocked } from './block.service.js';
import { recordKeywordScan, createModerationItem } from './moderation.service.js';
import {
  incrementPromptCount,
  incrementResponseCount,
  incrementNegativeFlags,
} from './userSignal.service.js';

const ensureMatchForUser = async (matchId, userId) => {
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [
        { userAId: userId },
        { userBId: userId },
      ],
    },
  });

  if (!match) {
    return null;
  }

  const partnerId = match.userAId === userId ? match.userBId : match.userAId;
  const blocked = await isEitherUserBlocked(userId, partnerId);
  if (blocked) {
    const error = new Error('Chat unavailable with blocked user');
    error.code = 'USER_BLOCKED';
    throw error;
  }

  return match;
};

export const reportMessageForMatch = async ({ matchId, messageId, reporterId, reason }) => {
  const match = await ensureMatchForUser(matchId, reporterId);
  if (!match) {
    const error = new Error('Match not found or access denied');
    error.code = 'MATCH_NOT_FOUND';
    throw error;
  }

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      matchId,
    },
  });

  if (!message) {
    const error = new Error('Message not found');
    error.code = 'MESSAGE_NOT_FOUND';
    throw error;
  }

  await prisma.messageReport.create({
    data: {
      messageId,
      reporterId,
      reason: reason?.slice(0, 250) || null,
    },
  });

  await prisma.message.update({
    where: { id: messageId },
    data: { flagged: true },
  });

  await createModerationItem({
    targetType: 'MESSAGE',
    targetId: messageId,
    reason: reason || 'USER_REPORT',
  });

  incrementNegativeFlags(message.senderId).catch(() => {});
  await maybeAutoHideUser(message.senderId);

  return {
    messageId,
    flagged: true,
  };
};

export const listMessagesForMatch = async ({ matchId, userId }) => {
  const match = await ensureMatchForUser(matchId, userId);
  if (!match) {
    const error = new Error('Match not found or access denied');
    error.code = 'MATCH_NOT_FOUND';
    throw error;
  }

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { sentAt: 'asc' },
  });

  const needsDelivery = await prisma.message.updateMany({
    where: {
      matchId,
      senderId: { not: userId },
      deliveredAt: null,
    },
    data: { deliveredAt: new Date() },
  });

  if (needsDelivery.count > 0) {
    const deliveredStamp = new Date();
    return messages.map((message) => {
      if (message.senderId !== userId && !message.deliveredAt) {
        return { ...message, deliveredAt: deliveredStamp };
      }
      return message;
    });
  }

  return messages;
};

export const sendMessageForMatch = async ({ matchId, userId, body }) => {
  if (!body) {
    const error = new Error('Message body is required');
    error.code = 'INVALID_MESSAGE';
    throw error;
  }

  const match = await ensureMatchForUser(matchId, userId);
  if (!match) {
    const error = new Error('Match not found or access denied');
    error.code = 'MATCH_NOT_FOUND';
    throw error;
  }

  const partnerId = match.userAId === userId ? match.userBId : match.userAId;

  const previousMessage = await prisma.message.findFirst({
    where: { matchId },
    orderBy: { sentAt: 'desc' },
  });

  const isResponse = Boolean(previousMessage && previousMessage.senderId !== userId);

  const message = await prisma.message.create({
    data: {
      matchId,
      senderId: userId,
      body,
      deliveredAt: new Date(),
    },
  });

  recordKeywordScan({ targetType: 'MESSAGE', targetId: message.id, text: body }).catch(() => {});
  incrementPromptCount(partnerId).catch(() => {});
  if (isResponse) {
    incrementResponseCount(userId).catch(() => {});
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { lastMessage: body },
  });

  return message;
};

const maybeAutoHideUser = async (userId) => {
  if (!userId) return;

  const [user, reporters] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.messageReport.findMany({
      where: { message: { senderId: userId } },
      select: { reporterId: true },
      distinct: ['reporterId'],
    }),
  ]);

  if (!user) {
    return;
  }

  if (reporters.length >= 3 && !user.isSnoozed) {
    await prisma.user.update({
      where: { id: userId },
      data: { isSnoozed: true },
    });
    await createModerationItem({
      targetType: 'PROFILE',
      targetId: userId,
      reason: 'AUTO_HIDE_REPORT_THRESHOLD',
      metadata: { reporterCount: reporters.length },
    });
  }
};

export const markMessagesAsRead = async ({ matchId, userId }) => {
  const match = await ensureMatchForUser(matchId, userId);
  if (!match) {
    const error = new Error('Match not found or access denied');
    error.code = 'MATCH_NOT_FOUND';
    throw error;
  }

  const now = new Date();
  const result = await prisma.message.updateMany({
    where: {
      matchId,
      senderId: { not: userId },
      readAt: null,
    },
    data: {
      readAt: now,
      deliveredAt: now,
    },
  });

  return {
    matchId,
    readAt: now,
    updatedCount: result.count,
  };
};
