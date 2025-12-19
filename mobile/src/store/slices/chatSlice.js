import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchMessagesApi, sendMessageApi, markChatReadApi, blockUserApi } from '../../services/api';

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ matchId, token }, { rejectWithValue }) => {
    try {
      const messages = await fetchMessagesApi({ matchId, token });
      return { matchId, messages };
    } catch (error) {
      return rejectWithValue({ matchId, message: error.message, status: error.status });
    }
  },
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ matchId, token, body }, { rejectWithValue }) => {
    try {
      const message = await sendMessageApi({ matchId, token, body });
      return { matchId, message };
    } catch (error) {
      return rejectWithValue({ matchId, message: error.message, status: error.status });
    }
  },
);

export const markChatRead = createAsyncThunk('chat/markRead', async ({ matchId, token }) => {
  const result = await markChatReadApi({ matchId, token });
  return { matchId, ...result };
});

export const blockMatchUser = createAsyncThunk(
  'chat/blockUser',
  async ({ token, blockedUserId, matchId }, { rejectWithValue }) => {
    try {
      const block = await blockUserApi({ token, blockedUserId });
      return { matchId, blockedUserId, block };
    } catch (error) {
      return rejectWithValue({ matchId, message: error.message, status: error.status });
    }
  },
);

const initialState = {
  threads: {},
  activeMatchId: null,
  status: 'idle',
  error: null,
  typingUsers: {},
  blockedMatches: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveMatch(state, action) {
      state.activeMatchId = action.payload;
    },
    receiveSocketMessage(state, action) {
      const { matchId, message } = action.payload;
      if (!state.threads[matchId]) {
        state.threads[matchId] = [];
      }
      state.threads[matchId].push(message);
    },
    receiveReadReceipt(state, action) {
      const { matchId, readerId, readAt, currentUserId } = action.payload;
      const messages = state.threads[matchId];
      if (!messages) return;
      const readDate = new Date(readAt).getTime();
      const isSelf = readerId === currentUserId;
      messages.forEach((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const messageTime = new Date(message.sentAt).getTime();
        const shouldUpdate = isSelf ? !isOwnMessage : isOwnMessage;
        if (shouldUpdate && messageTime <= readDate) {
          message.readAt = readAt;
          message.deliveredAt = message.deliveredAt || readAt;
        }
      });
    },
    receiveTypingUpdate(state, action) {
      const { matchId, typingUserIds } = action.payload;
      state.typingUsers[matchId] = typingUserIds;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.threads[action.payload.matchId] = action.payload.messages;
        delete state.blockedMatches[action.payload.matchId];
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || action.error.message;
        if (action.payload?.status === 403 && action.payload.matchId) {
          state.blockedMatches[action.payload.matchId] = {
            isBlocked: true,
          };
        }
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { matchId, message } = action.payload;
        if (!state.threads[matchId]) {
          state.threads[matchId] = [];
        }
        state.threads[matchId].push(message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload?.message || action.error.message;
        if (action.payload?.status === 403 && action.payload.matchId) {
          state.blockedMatches[action.payload.matchId] = {
            isBlocked: true,
          };
        }
      })
      .addCase(markChatRead.fulfilled, (state, action) => {
        const { matchId, readAt } = action.payload;
        const messages = state.threads[matchId];
        if (!messages) return;
        messages.forEach((message) => {
          if (!message.readAt) {
            message.readAt = readAt;
          }
          if (!message.deliveredAt) {
            message.deliveredAt = readAt;
          }
        });
      })
      .addCase(blockMatchUser.fulfilled, (state, action) => {
        const { matchId, blockedUserId } = action.payload;
        if (!matchId) return;
        state.blockedMatches[matchId] = {
          isBlocked: true,
          blockedByMe: true,
          blockedUserId,
        };
      });
  },
});

export const { setActiveMatch, receiveSocketMessage, receiveReadReceipt, receiveTypingUpdate } = chatSlice.actions;
export default chatSlice.reducer;
