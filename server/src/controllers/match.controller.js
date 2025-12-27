import { createMatch as createMatchService, listMatchesForUser } from '../services/match.service.js';

export const listMatches = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const matches = await listMatchesForUser(userId);
    return res.json(matches);
  } catch (error) {
    return next(error);
  }
};

export const createMatch = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { partnerId } = req.body;

    if (!userId || !partnerId) {
      return res.status(400).json({ message: 'userId and partnerId are required' });
    }

    const match = await createMatchService({ userId, partnerId });
    return res.status(201).json(match);
  } catch (error) {
    return next(error);
  }
};
