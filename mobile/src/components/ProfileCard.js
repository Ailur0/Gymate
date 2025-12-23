import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../theme';

const buildAvatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=222933&color=fff&name=${encodeURIComponent(name)}`;

const ProfileCard = ({ profile }) => {
  if (!profile) return null;

  const compatibilityPercent =
    typeof profile.compatibilityScore === 'number'
      ? Math.round(profile.compatibilityScore * 100)
      : null;

  const distanceKm =
    typeof profile.distanceKm === 'number'
      ? profile.distanceKm
      : typeof profile.location?.distanceKm === 'number'
        ? profile.location.distanceKm
        : null;

  const locationName = profile.location?.name;
  const distanceLabel = distanceKm != null ? `${distanceKm.toFixed(1)} km away` : 'Distance hidden';

  return (
    <View style={styles.card}>
      <Image source={{ uri: buildAvatarUrl(profile.name) }} style={styles.image} />
      <LinearGradient
        colors={["rgba(11,13,15,0)", "rgba(11,13,15,0.9)"]}
        style={styles.overlay}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.age ? <Text style={styles.age}>{profile.age}</Text> : null}
        </View>
        <Text style={styles.meta}>{`${profile.fitnessLevel} · ${profile.primaryGoal || 'Goals TBD'}`}</Text>
        <View style={styles.metricsRow}>
          {compatibilityPercent != null && (
            <View style={[styles.metricChip, styles.matchChip]}>
              <Text style={styles.metricText}>{`${compatibilityPercent}% Match`}</Text>
            </View>
          )}
          <View style={styles.metricChip}>
            <Text style={styles.metricText}>{distanceLabel}</Text>
          </View>
          {locationName ? (
            <View style={styles.metricChip}>
              <Text style={styles.metricText}>{locationName}</Text>
            </View>
          ) : null}
        </View>
        {profile.interests?.length ? (
          <View style={styles.tagRow}>
            {profile.interests.slice(0, 3).map((interest) => (
              <View key={interest} style={styles.tag}>
                <Text style={styles.tagText}>{interest}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  name: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  age: {
    fontSize: typography.subheading,
    color: colors.textSecondary,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  matchChip: {
    backgroundColor: 'rgba(255,118,82,0.85)',
  },
  metricText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tagText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
  },
  bio: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 20,
  },
});

export default ProfileCard;
