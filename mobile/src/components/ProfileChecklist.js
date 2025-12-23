import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

const steps = [
  { key: 'photo', label: 'Upload profile photo' },
  { key: 'schedule', label: 'Add preferred workout times' },
  { key: 'goals', label: 'Define fitness goals' },
  { key: 'interests', label: 'Select workout interests' },
  { key: 'bio', label: 'Write a short bio' },
];

const ProfileChecklist = ({ profile }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Profile Completion</Text>
    {steps.map((step) => {
      const completed = (() => {
        switch (step.key) {
          case 'photo':
            return Boolean(profile?.photos?.length);
          case 'schedule':
            return Boolean(profile?.workoutTimes?.length);
          case 'goals':
            return Boolean(profile?.primaryGoal);
          case 'interests':
            return Boolean(profile?.interests?.length);
          case 'bio':
            return Boolean(profile?.bio);
          default:
            return false;
        }
      })();
      return (
        <View key={step.key} style={styles.row}>
          <View style={[styles.statusDot, completed && styles.statusDotDone]} />
          <Text style={[styles.label, completed && styles.completed]}>{step.label}</Text>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  label: {
    color: colors.textSecondary,
  },
  completed: {
    color: colors.textPrimary,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  statusDotDone: {
    backgroundColor: colors.accent,
  },
});

export default ProfileChecklist;
