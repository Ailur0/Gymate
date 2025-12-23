import { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'swipe',
    title: 'Swipe to Find Partners',
    description: 'Like, pass, or super like gym partners nearby with a familiar gesture-driven interface.',
    icon: 'flame',
  },
  {
    key: 'match',
    title: 'Match & Chat Instantly',
    description: 'Once you match, jump straight into chat to plan sessions and stay accountable.',
    icon: 'chatbubble-ellipses',
  },
  {
    key: 'safety',
    title: 'Safety Comes First',
    description: 'Verification, blocking, and reporting tools keep the community safe and respectful.',
    icon: 'shield-checkmark',
  },
];

const OnboardingScreen = ({ onComplete }) => {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index >= slides.length - 1) {
      onComplete?.();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const handleMomentumEnd = (event) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}> 
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={48} color={colors.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.pagination}>
        {slides.map((_, dotIndex) => (
          <View
            key={`dot-${dotIndex}`}
            style={[styles.dot, dotIndex === index && styles.dotActive]}
          />
        ))}
      </View>

      <PrimaryButton
        label={index >= slides.length - 1 ? 'Get Started' : 'Next'}
        onPress={handleNext}
      />
      {index < slides.length - 1 && (
        <PrimaryButton label="Skip" variant="secondary" onPress={onComplete} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
});

export default OnboardingScreen;
