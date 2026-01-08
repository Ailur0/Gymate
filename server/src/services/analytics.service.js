import prisma from '../lib/prisma.js';

export const summarizeUserSignals = async ({ sinceHours = 24 } = {}) => {
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
  const totalUsers = await prisma.user.count();
  const signals = await prisma.userSignal.findMany();

  const aggregates = signals.reduce(
    (acc, signal) => {
      const promptCount = signal.promptCount || 0;
      const responseCount = signal.responseCount || 0;
      const responseRate = promptCount > 0 ? responseCount / promptCount : 0;
      acc.totalSignals += 1;
      acc.totalPrompts += promptCount;
      acc.totalResponses += responseCount;
      acc.totalPositive += signal.positiveMatches || 0;
      acc.totalNegativeFlags += signal.negativeFlags || 0;
      if (responseRate >= 0.6) {
        acc.highResponders += 1;
      }
      if ((signal.lastBoostAt && signal.lastBoostAt >= since) || responseRate >= 0.6) {
        acc.recentBoosts += 1;
      }
      if (signal.negativeFlags >= 2) {
        acc.highRisk += 1;
      }
      return acc;
    },
    {
      totalSignals: 0,
      totalPrompts: 0,
      totalResponses: 0,
      totalPositive: 0,
      totalNegativeFlags: 0,
      highResponders: 0,
      recentBoosts: 0,
      highRisk: 0,
    },
  );

  return {
    totalUsers,
    ...aggregates,
    averageResponseRate:
      aggregates.totalPrompts > 0 ? aggregates.totalResponses / aggregates.totalPrompts : 0,
  };
};
