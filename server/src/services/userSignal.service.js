import prisma from '../lib/prisma.js';

const ensureSignal = async (userId) => {
  if (!userId) return null;
  return prisma.userSignal.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

const incrementField = async (userId, field) => {
  if (!userId) return;
  await ensureSignal(userId);
  await prisma.userSignal.update({
    where: { userId },
    data: {
      [field]: {
        increment: 1,
      },
    },
  });
};

export const incrementPromptCount = async (userId) => incrementField(userId, 'promptCount');

export const incrementResponseCount = async (userId) => incrementField(userId, 'responseCount');

export const incrementPositiveMatches = async (userId) => incrementField(userId, 'positiveMatches');

export const incrementNegativeFlags = async (userId) => incrementField(userId, 'negativeFlags');

export const markBoostTimestamp = async (userId, date = new Date()) => {
  if (!userId) return;
  await ensureSignal(userId);
  await prisma.userSignal.update({
    where: { userId },
    data: {
      lastBoostAt: date,
    },
  });
};

export const getSignalForUsers = async (userIds = []) => {
  if (!userIds.length) return {};
  const signals = await prisma.userSignal.findMany({ where: { userId: { in: userIds } } });
  return signals.reduce((acc, signal) => {
    acc[signal.userId] = signal;
    return acc;
  }, {});
};
