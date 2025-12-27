import { listModerationItems, resolveModerationItem } from '../services/moderation.service.js';

export const listQueue = async (req, res, next) => {
  try {
    const { status = 'PENDING', limit = 50 } = req.query;
    const numericLimit = Number(limit) || 50;
    const items = await listModerationItems({ status: status.toUpperCase(), limit: numericLimit });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
};

export const resolveItem = async (req, res, next) => {
  try {
    const moderatorId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const item = await resolveModerationItem({ id, status: status.toUpperCase(), moderatorId });
    return res.json(item);
  } catch (error) {
    if (error.code === 'INVALID_STATUS') {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
};
