import * as Location from 'expo-location';

export const requestCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const error = new Error('Location permission denied');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = position.coords;

  let placeName = null;
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (address) {
      const parts = [address.name, address.city, address.region].filter(Boolean);
      placeName = parts.join(', ') || address.country || null;
    }
  } catch (error) {
    // Ignore reverse geocode failures; coordinates are sufficient for matchmaking
  }

  return {
    latitude,
    longitude,
    name: placeName,
  };
};
