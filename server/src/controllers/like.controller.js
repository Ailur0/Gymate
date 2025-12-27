import { recordLike, recordPass } from '../services/like.service.js';
import { getThrottleSnapshot, incrementSwipeUsage } from '../services/swipeThrottle.service.js';

export const likeUser = async (req, res, next) => {
  try {
    const { targetUserId, superLike = false, userId: fallbackUserId } = req.body;
    const userId = req.user?.id || fallbackUserId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required' });
    }

    let throttle;
    try {
      throttle = await incrementSwipeUsage({ userId, superLike });
    } catch (error) {
      if (error.code === 'SWIPE_LIMIT_REACHED') {
        return res.status(429).json({ message: error.message, throttle: error.meta });
      }
      throw error;
    }

    const result = await recordLike({ fromUserId: userId, toUserId: targetUserId, isSuper: superLike });

    return res.status(result.match ? 201 : 200).json({
      status: result.match ? 'match' : 'liked',
      match: result.match || undefined,
      throttle,
    });
  } catch (error) {
    if (error.code === 'INVALID_LIKE') {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
};

export const passUser = async (req, res, next) => {
  try {
    const { targetUserId, userId: fallbackUserId } = req.body;
    const userId = req.user?.id || fallbackUserId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required' });
    }

    const result = await recordPass({ fromUserId: userId, toUserId: targetUserId });

    const throttle = await getThrottleSnapshot(userId);

    return res.json({
      status: result.status,
      throttle,
    });
  } catch (error) {
    return next(error);
  }
};
