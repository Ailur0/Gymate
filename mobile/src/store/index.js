import { configureStore } from '@reduxjs/toolkit';
import profilesReducer from './slices/profilesSlice';
import matchesReducer from './slices/matchesSlice';
import chatReducer from './slices/chatSlice';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    profiles: profilesReducer,
    matches: matchesReducer,
    chat: chatReducer,
  },
});

export default store;
