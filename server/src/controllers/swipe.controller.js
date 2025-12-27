import { getSwipeQueueForUser } from '../services/swipe.service.js';

const parseFitnessLevels = (raw) => {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw.filter(Boolean);
  }
  return String(raw)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const buildFilters = (query = {}) => ({
  radiusKm: query.radiusKm ? Number(query.radiusKm) : undefined,
  gender: query.gender,
  fitnessLevels: parseFitnessLevels(query.fitnessLevels),
  minScore: query.minScore ? Number(query.minScore) : undefined,
});

export const listSwipeQueue = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId; // fallback for dev/mobile stubs
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const filters = buildFilters(req.query);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const queue = await getSwipeQueueForUser({ userId, limit, filters });
    return res.json({
      items: queue,
      count: queue.length,
    });
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    return next(error);
  }
};
