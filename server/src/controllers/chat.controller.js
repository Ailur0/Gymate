import { listMessagesForMatch, sendMessageForMatch, markMessagesAsRead, reportMessageForMatch } from '../services/chat.service.js';
import { setTypingState, getTypingUsers } from '../services/typing.service.js';

export const listMessages = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const messages = await listMessagesForMatch({ matchId, userId });
    return res.json(messages);
  } catch (error) {
    if (error.code === 'MATCH_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'USER_BLOCKED') {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
};

export const reportMessage = async (req, res, next) => {
  try {
    const reporterId = req.user?.id;
    const { matchId } = req.params;
    const { messageId, reason } = req.body;

    if (!reporterId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!messageId) {
      return res.status(400).json({ message: 'messageId is required' });
    }

    const result = await reportMessageForMatch({ matchId, messageId, reporterId, reason });

    return res.status(201).json(result);
  } catch (error) {
    if (error.code === 'MATCH_NOT_FOUND' || error.code === 'MESSAGE_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'USER_BLOCKED') {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await markMessagesAsRead({ matchId, userId });

    req.app.get('io').to(matchId).emit('chat:read', {
      matchId,
      userId,
      readAt: result.readAt,
    });

    return res.json(result);
  } catch (error) {
    if (error.code === 'MATCH_NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    return next(error);
  }
};

export const updateTypingState = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { isTyping = false } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await setTypingState({ matchId, userId, isTyping: Boolean(isTyping) });
    const typingUserIds = await getTypingUsers(matchId);

    req.app.get('io').to(matchId).emit('chat:typing', {
      matchId,
      typingUserIds,
    });

    return res.json({ matchId, typingUserIds });
  } catch (error) {
    return next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { matchId } = req.params;
    const { body } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const message = await sendMessageForMatch({ matchId, userId, body });

    req.app.get('io').to(matchId).emit('chat:message', {
      matchId,
      message,
    });

    return res.status(201).json(message);
  } catch (error) {
    if (error.code === 'MATCH_NOT_FOUND' || error.code === 'INVALID_MESSAGE') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'USER_BLOCKED') {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
};
