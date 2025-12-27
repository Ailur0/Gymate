import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

const chips = {
  goals: ['Lose fat', 'Build muscle', 'Stay consistent', 'Train for event'],
  interests: ['Strength', 'Cardio', 'HIIT', 'Yoga', 'CrossFit', 'Pilates'],
  times: ['Morning', 'Afternoon', 'Evening', 'Flexible'],
  levels: ['Beginner', 'Intermediate', 'Advanced'],
};

const ChipGroup = ({ options, selected = [], onToggle }) => (
  <View style={styles.chipRow}>
    {options.map((option) => {
      const isActive = selected.includes(option);
      return (
        <Text
          key={option}
          style={[styles.chip, isActive && styles.chipActive]}
          onPress={() => onToggle(option)}
        >
          {option}
        </Text>
      );
    })}
  </View>
);

const buildState = (values = {}) => ({
  name: values.name || '',
  age: values.age ? String(values.age) : '',
  fitnessLevel: values.fitnessLevel || 'Beginner',
  primaryGoal: values.primaryGoal || '',
  interests: values.interests || [],
  workoutTimes: values.workoutTimes || [],
  bio: values.bio || '',
});

const ProfileForm = ({ initialValues = {}, onChange }) => {
  const [form, setForm] = useState(buildState(initialValues));

  useEffect(() => {
    setForm(buildState(initialValues));
  }, [initialValues]);

  const updateField = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    onChange?.(next);
  };

  const toggleChip = (field, value) => {
    const current = form[field] || [];
    const exists = current.includes(value);
    const updated = exists ? current.filter((item) => item !== value) : [...current, value];
    updateField(field, updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(text) => updateField('name', text)}
        placeholder="Your name"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        value={form.age}
        keyboardType="number-pad"
        onChangeText={(text) => updateField('age', text)}
        placeholder="24"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Fitness Level</Text>
      <ChipGroup
        options={chips.levels}
        selected={form.fitnessLevel ? [form.fitnessLevel] : []}
        onToggle={(value) => updateField('fitnessLevel', value)}
      />

      <Text style={styles.label}>Primary Goal</Text>
      <ChipGroup
        options={chips.goals}
        selected={form.primaryGoal ? [form.primaryGoal] : []}
        onToggle={(goal) => updateField('primaryGoal', goal)}
      />

      <Text style={styles.label}>Workout Times</Text>
      <ChipGroup
        options={chips.times}
        selected={form.workoutTimes}
        onToggle={(value) => toggleChip('workoutTimes', value)}
      />

      <Text style={styles.label}>Workout Interests</Text>
      <ChipGroup
        options={chips.interests}
        selected={form.interests}
        onToggle={(value) => toggleChip('interests', value)}
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        value={form.bio}
        onChangeText={(text) => updateField('bio', text)}
        placeholder="Share a quick intro..."
        placeholderTextColor={colors.textSecondary}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: {
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});

export default ProfileForm;
