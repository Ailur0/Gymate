const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const buildUrl = (path) => `${API_URL}${path}`;

const buildHeaders = (token) => {
  const headers = { ...jsonHeaders };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const buildSwipeBody = ({ targetUserId, superLike, userId }) => {
  const body = { targetUserId };
  if (typeof superLike !== 'undefined') {
    body.superLike = superLike;
  }
  if (userId) {
    body.userId = userId;
  }
  return body;
};

const parseError = async (response, fallbackMessage) => {
  let message = fallbackMessage;
  try {
    const data = await response.json();
    message = data?.message || fallbackMessage;
  } catch (error) {
    const text = await response.text();
    if (text) {
      message = text;
    }
  }
  return message;
};

const buildResponseError = async (response, fallbackMessage) => {
  const message = await parseError(response, fallbackMessage);
  const error = new Error(message);
  error.status = response.status;
  return error;
};

export const requestOtpApi = async ({ phone, countryCode = '+1' }) => {
  const response = await fetch(buildUrl('/api/auth/otp/request'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ phone, countryCode }),
  });
  if (!response.ok) {
    const message = await parseError(response, 'Failed to request OTP');
    throw new Error(message);
  }
  return response.json();
};

export const verifyOtpApi = async ({ phone, otp }) => {
  const response = await fetch(buildUrl('/api/auth/otp/verify'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ phone, otp }),
  });
  if (!response.ok) {
    const message = await parseError(response, 'Failed to verify OTP');
    throw new Error(message);
  }
  return response.json();
};

const appendFiltersToParams = (params, filters = {}) => {
  if (!filters) return;
  if (filters.radiusKm) params.append('radiusKm', filters.radiusKm);
  if (filters.gender) params.append('gender', filters.gender);
  if (filters.minScore) params.append('minScore', filters.minScore);
  if (filters.fitnessLevels?.length) {
    filters.fitnessLevels.forEach((level) => params.append('fitnessLevels', level));
  }
};

export const fetchSwipeQueueApi = async ({ userId, limit, filters } = {}) => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (limit) params.append('limit', limit);
  appendFiltersToParams(params, filters);
  const query = params.toString();
  const response = await fetch(buildUrl(`/api/swipes/queue${query ? `?${query}` : ''}`));
  if (!response.ok) {
    throw new Error('Failed to load swipe queue');
  }
  return response.json();
};

export const sendLikeApi = async ({ token, userId, targetUserId, superLike = false }) => {
  const response = await fetch(buildUrl('/api/swipes/like'), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(buildSwipeBody({ targetUserId, superLike, userId })),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to like user');
  }
  return response.json();
};

export const sendPassApi = async ({ token, userId, targetUserId }) => {
  const response = await fetch(buildUrl('/api/swipes/pass'), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(buildSwipeBody({ targetUserId, userId })),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Failed to pass user');
  }
  return response.json();
};

export const fetchProfilesApi = async (query) => {
  const params = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await fetch(buildUrl(`/api/profiles${params}`));
  if (!response.ok) {
    throw new Error('Failed to load profiles');
  }
  return response.json();
};

export const fetchMatchesApi = async (userId) => {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const response = await fetch(buildUrl(`/api/matches${params}`));
  if (!response.ok) {
    throw new Error('Failed to load matches');
  }
  return response.json();
};

export const fetchMessagesApi = async ({ matchId, token }) => {
  const response = await fetch(buildUrl(`/api/chats/${matchId}`), {
    headers: buildHeaders(token),
  });
  if (!response.ok) {
    throw await buildResponseError(response, 'Failed to load messages');
  }
  return response.json();
};

export const sendMessageApi = async ({ matchId, token, body }) => {
  const response = await fetch(buildUrl(`/api/chats/${matchId}`), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    throw await buildResponseError(response, 'Failed to send message');
  }
  return response.json();
};

export const markChatReadApi = async ({ matchId, token }) => {
  const response = await fetch(buildUrl(`/api/chats/${matchId}/read`), {
    method: 'POST',
    headers: buildHeaders(token),
  });
  if (!response.ok) {
    throw await buildResponseError(response, 'Failed to mark messages as read');
  }
  return response.json();
};

export const updateTypingApi = async ({ matchId, token, isTyping }) => {
  const response = await fetch(buildUrl(`/api/chats/${matchId}/typing`), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ isTyping }),
  });
  if (!response.ok) {
    const message = await parseError(response, 'Failed to update typing state');
    throw new Error(message);
  }
  return response.json();
};

export const reportMessageApi = async ({ matchId, token, messageId, reason }) => {
  const response = await fetch(buildUrl(`/api/chats/${matchId}/report`), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ messageId, reason }),
  });
  if (!response.ok) {
    const message = await parseError(response, 'Failed to report message');
    throw new Error(message);
  }
  return response.json();
};

export const blockUserApi = async ({ token, blockedUserId }) => {
  const response = await fetch(buildUrl('/api/blocks'), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ blockedUserId }),
  });
  if (!response.ok) {
    throw await buildResponseError(response, 'Failed to block user');
  }
  return response.json();
};

export const unblockUserApi = async ({ token, blockedUserId }) => {
  const response = await fetch(buildUrl(`/api/blocks/${blockedUserId}`), {
    method: 'DELETE',
    headers: buildHeaders(token),
  });
  if (!response.ok) {
    throw await buildResponseError(response, 'Failed to unblock user');
  }
  return true;
};

export const fetchProfileApi = async (profileId) => {
  const response = await fetch(buildUrl(`/api/profiles/${profileId}`));
  if (!response.ok) {
    throw new Error('Failed to load profile');
  }
  return response.json();
};

export const upsertProfileApi = async (profile) => {
  const method = profile.id ? 'PUT' : 'POST';
  const url = profile.id ? `/api/profiles/${profile.id}` : '/api/profiles';
  const response = await fetch(buildUrl(url), {
    method,
    headers: jsonHeaders,
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    throw new Error('Failed to save profile');
  }
  return response.json();
};

export const updateLocationApi = async ({ token, lat, lng, name }) => {
  const response = await fetch(buildUrl('/api/profiles/location/update'), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ lat, lng, name }),
  });
  if (!response.ok) {
    throw await buildResponseError(response, 'Failed to update location');
  }
  return response.json();
};
