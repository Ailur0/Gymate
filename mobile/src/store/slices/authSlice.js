import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { requestOtpApi, verifyOtpApi } from '../../services/api';

const AUTH_TOKEN_KEY = 'gymate:auth_token';
const AUTH_USER_KEY = 'gymate:auth_user';

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const [token, userRaw] = await Promise.all([
    AsyncStorage.getItem(AUTH_TOKEN_KEY),
    AsyncStorage.getItem(AUTH_USER_KEY),
  ]);

  return {
    token,
    user: userRaw ? JSON.parse(userRaw) : null,
  };
});

export const requestOtp = createAsyncThunk('auth/requestOtp', async ({ phone, countryCode }) => {
  const response = await requestOtpApi({ phone, countryCode });
  return response;
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ phone, otp }) => {
  const response = await verifyOtpApi({ phone, otp });
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  return response;
});

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
});

const initialState = {
  phone: '',
  countryCode: '+1',
  token: null,
  user: null,
  requestStatus: 'idle',
  verifyStatus: 'idle',
  hydrateStatus: 'idle',
  error: null,
  otpExpiresAt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhone(state, action) {
      state.phone = action.payload;
    },
    setCountryCode(state, action) {
      state.countryCode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.hydrateStatus = 'loading';
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.hydrateStatus = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.hydrateStatus = 'failed';
      })
      .addCase(requestOtp.pending, (state) => {
        state.requestStatus = 'loading';
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.requestStatus = 'succeeded';
        state.otpExpiresAt = action.payload.expiresAt || null;
        state.phone = action.meta.arg.phone;
        state.countryCode = action.meta.arg.countryCode || state.countryCode;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.requestStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.verifyStatus = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verifyStatus = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.otpExpiresAt = null;
        state.requestStatus = 'idle';
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifyStatus = 'failed';
        state.error = action.error.message;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.requestStatus = 'idle';
        state.verifyStatus = 'idle';
        state.error = null;
      });
  },
});

export const { setPhone, setCountryCode } = authSlice.actions;
export default authSlice.reducer;
