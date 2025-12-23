import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import BaseScreen from '../components/BaseScreen';
import ProfileChecklist from '../components/ProfileChecklist';
import ProfileForm from '../components/ProfileForm';
import PrimaryButton from '../components/PrimaryButton';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCurrentProfile, saveProfile, syncLocation } from '../store/slices/profilesSlice';
import { requestCurrentLocation } from '../utils/location';
import { colors, spacing, typography } from '../theme';

const REQUIRED_FIELDS = ['name', 'age', 'fitnessLevel', 'primaryGoal', 'workoutTimes'];

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { currentProfile, currentStatus, currentError, locationStatus, locationError, lastKnownLocation } =
    useAppSelector((state) => state.profiles);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!currentProfile && currentStatus === 'idle') {
      dispatch(fetchCurrentProfile());
    }
  }, [dispatch, currentProfile, currentStatus]);

  useEffect(() => {
    setDraft(currentProfile ?? null);
  }, [currentProfile]);

  const handleSave = async () => {
    if (!draft) return;
    const missing = REQUIRED_FIELDS.filter((field) => {
      const value = draft[field];
      if (Array.isArray(value)) return value.length === 0;
      return !value;
    });

    if (missing.length) {
      Alert.alert('Incomplete Profile', 'Please fill all required fields before saving.');
      return;
    }

    dispatch(saveProfile({ ...draft, age: Number(draft.age) }));
  };

  const completion = (() => {
    if (!draft) return 0;
    const filled = REQUIRED_FIELDS.filter((field) => {
      const value = draft[field];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(value);
    }).length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
  })();

  const isSaving = currentStatus === 'saving';
  const isSyncingLocation = locationStatus === 'loading';

  const handleSyncLocation = async () => {
    try {
      const coords = await requestCurrentLocation();
      dispatch(syncLocation({ lat: coords.latitude, lng: coords.longitude, name: coords.name }));
    } catch (error) {
      if (error.code === 'PERMISSION_DENIED') {
        Alert.alert('Permission needed', 'Enable location access in settings to share nearby matches.');
        return;
      }
      Alert.alert('Unable to fetch location', error.message || 'Please try again later.');
    }
  };

  return (
    <BaseScreen>
      <Text style={styles.header}>Your Profile</Text>
      <Text style={styles.subheader}>Complete your profile to improve match quality.</Text>
      <TouchableOpacity
        style={[styles.locationButton, isSyncingLocation && styles.locationButtonDisabled]}
        onPress={handleSyncLocation}
        disabled={isSyncingLocation}
      >
        <Text style={styles.locationButtonText}>{isSyncingLocation ? 'Updating location…' : 'Share current location'}</Text>
      </TouchableOpacity>
      {lastKnownLocation && (
        <Text style={styles.locationMeta}>
          Last synced: {lastKnownLocation.name || `${lastKnownLocation.lat.toFixed(2)}, ${lastKnownLocation.lng.toFixed(2)}`}
        </Text>
      )}
      {locationError && <Text style={styles.error}>{locationError}</Text>}

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${completion}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{completion}%</Text>
      </View>

      {currentStatus === 'loading' && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {currentError && currentStatus === 'failed' && (
        <Text style={styles.error}>{currentError}</Text>
      )}

      {draft && (
        <>
          <ProfileChecklist profile={draft} />
          <ProfileForm initialValues={draft} onChange={setDraft} />
          <PrimaryButton label={isSaving ? 'Saving...' : 'Save Profile'} onPress={handleSave} />
        </>
      )}
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  subheader: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  locationButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationButtonText: {
    color: colors.accent,
    fontWeight: '600',
  },
  locationMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.card,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  progressLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
});

export default ProfileScreen;
