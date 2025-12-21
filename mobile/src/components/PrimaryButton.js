import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';

const PrimaryButton = ({ label, onPress, variant = 'primary' }) => (
  <TouchableOpacity
    style={[styles.base, variant === 'secondary' ? styles.secondary : styles.primary]}
    onPress={onPress}
  >
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
});

export default PrimaryButton;
