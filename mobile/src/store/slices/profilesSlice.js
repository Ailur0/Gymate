import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchSwipeQueueApi, fetchProfileApi, upsertProfileApi, updateLocationApi } from '../../services/api';

export const fetchProfiles = createAsyncThunk('profiles/fetch', async ({ userId, limit, filters } = {}) => {
  if (!userId) {
    return [];
  }
  const response = await fetchSwipeQueueApi({ userId, limit, filters });
  return response.items;
});

export const fetchCurrentProfile = createAsyncThunk('profiles/current', async (_, { getState, rejectWithValue }) => {
  const userId = getState().auth?.user?.id;
  if (!userId) {
    return rejectWithValue('Missing user');
  }
  const profile = await fetchProfileApi(userId);
  return profile;
});

export const saveProfile = createAsyncThunk('profiles/save', async (payload) => {
  const profile = await upsertProfileApi(payload);
  return profile;
});

export const syncLocation = createAsyncThunk(
  'profiles/syncLocation',
  async ({ lat, lng, name }, { getState, rejectWithValue }) => {
    const token = getState().auth?.token;
    if (!token) {
      return rejectWithValue('Missing auth token');
    }
    try {
      const profile = await updateLocationApi({ token, lat, lng, name });
      return { profile, location: { lat, lng, name } };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update location');
    }
  },
);

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  activeIndex: 0,
  currentProfile: null,
  currentStatus: 'idle',
  currentError: null,
  locationStatus: 'idle',
  locationError: null,
  lastKnownLocation: null,
};

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    nextProfile(state) {
      state.activeIndex = Math.min(state.activeIndex + 1, state.items.length - 1);
    },
    resetProfiles(state) {
      state.activeIndex = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfiles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.activeIndex = 0;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchCurrentProfile.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
      })
      .addCase(fetchCurrentProfile.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(fetchCurrentProfile.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.payload || action.error.message;
      })
      .addCase(saveProfile.pending, (state) => {
        state.currentStatus = 'saving';
        state.currentError = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.currentStatus = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.currentStatus = 'failed';
        state.currentError = action.error.message;
      })
      .addCase(syncLocation.pending, (state) => {
        state.locationStatus = 'loading';
        state.locationError = null;
      })
      .addCase(syncLocation.fulfilled, (state, action) => {
        state.locationStatus = 'succeeded';
        state.lastKnownLocation = action.payload.location;
        state.currentProfile = action.payload.profile ?? state.currentProfile;
      })
      .addCase(syncLocation.rejected, (state, action) => {
        state.locationStatus = 'failed';
        state.locationError = action.payload || action.error.message;
      });
  },
});

export const { nextProfile, resetProfiles } = profilesSlice.actions;
export default profilesSlice.reducer;
