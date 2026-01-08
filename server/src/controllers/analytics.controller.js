import { summarizeUserSignals } from '../services/analytics.service.js';

export const summarizeSignals = async (req, res, next) => {
  try {
    const { windowHours } = req.query;
    const summary = await summarizeUserSignals({ sinceHours: Number(windowHours) || 24 });
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
};
