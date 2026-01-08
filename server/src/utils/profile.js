const parseJsonList = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const serializeJsonList = (value) => {
  if (!value || !Array.isArray(value)) return null;
  return JSON.stringify(value);
};

const normalizeCoordinate = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

export const mapUserToProfile = (user) => {
  if (!user) return null;

  const {
    workoutTimesJson,
    interestsJson,
    displayName,
    locationName,
    locationLat,
    locationLng,
    ...rest
  } = user;

  return {
    ...rest,
    name: displayName,
    workoutTimes: parseJsonList(workoutTimesJson),
    interests: parseJsonList(interestsJson),
    location: locationName || locationLat || locationLng
      ? {
          name: locationName,
          lat: locationLat,
          lng: locationLng,
        }
      : null,
  };
};

export const buildProfileUpdate = (payload = {}) => {
  const {
    name,
    workoutTimes,
    interests,
    location,
    locationLat,
    locationLng,
    locationName: locationNameOverride,
    ...rest
  } = payload;

  const normalizedLat = normalizeCoordinate(location?.lat ?? locationLat);
  const normalizedLng = normalizeCoordinate(location?.lng ?? locationLng);
  const locationName = location?.name ?? locationNameOverride ?? null;

  return {
    displayName: name,
    workoutTimesJson: serializeJsonList(workoutTimes),
    interestsJson: serializeJsonList(interests),
    locationName,
    locationLat: normalizedLat,
    locationLng: normalizedLng,
    ...rest,
  };
};
