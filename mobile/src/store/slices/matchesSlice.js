import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchMatchesApi } from '../../services/api';

export const fetchMatches = createAsyncThunk('matches/fetch', async (userId = 'u1') => {
  const matches = await fetchMatchesApi(userId);
  return matches;
});

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

const matchesSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default matchesSlice.reducer;
