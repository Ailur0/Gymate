import { createBlock, deleteBlock, listBlocksForUser } from '../services/block.service.js';

export const listBlocks = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const blocks = await listBlocksForUser(userId);
    return res.json(blocks);
  } catch (error) {
    return next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const blockerId = req.user?.id;
    const { blockedUserId } = req.body;

    if (!blockerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!blockedUserId) {
      return res.status(400).json({ message: 'blockedUserId is required' });
    }

    const block = await createBlock({ blockerId, blockedId: blockedUserId });
    return res.status(201).json(block);
  } catch (error) {
    if (error.code === 'BLOCK_SELF_NOT_ALLOWED') {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const blockerId = req.user?.id;
    const { blockedUserId } = req.params;

    if (!blockerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!blockedUserId) {
      return res.status(400).json({ message: 'blockedUserId is required' });
    }

    await deleteBlock({ blockerId, blockedId: blockedUserId });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
