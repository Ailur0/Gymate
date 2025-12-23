import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-deck-swiper';

import BaseScreen from '../components/BaseScreen';
import ProfileCard from '../components/ProfileCard';
import SwipeActions from '../components/SwipeActions';
import { colors, typography } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProfiles, nextProfile, resetProfiles } from '../store/slices/profilesSlice';
import { sendLikeApi, sendPassApi } from '../services/api';

const radiusOptions = [5, 10, 25];
const fitnessLevelOptions = ['Beginner', 'Intermediate', 'Advanced'];
const genderOptions = [
  { label: 'Any', value: null },
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
];

const DiscoverScreen = () => {
  const dispatch = useAppDispatch();
  const { items, status, activeIndex, error } = useAppSelector((state) => state.profiles);
  const { user, token } = useAppSelector((state) => state.auth);
  const userId = user?.id;
  const currentProfile = items[activeIndex];
  const swiperRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    radiusKm: radiusOptions[0],
    gender: null,
    fitnessLevels: [],
  });

  useEffect(() => {
    if (!userId) {
      return;
    }
    dispatch(resetProfiles());
    dispatch(fetchProfiles({ userId, filters }));
  }, [dispatch, filters, userId]);

  const toggleFitnessLevel = (level) => {
    setFilters((prev) => {
      const exists = prev.fitnessLevels.includes(level);
      return {
        ...prev,
        fitnessLevels: exists
          ? prev.fitnessLevels.filter((item) => item !== level)
          : [...prev.fitnessLevels, level],
      };
    });
  };

  const selectRadius = (radiusKm) => {
    setFilters((prev) => ({ ...prev, radiusKm }));
  };

  const selectGender = (value) => {
    setFilters((prev) => ({ ...prev, gender: value }));
  };

  const filterSummary = useMemo(() => {
    const parts = [`≤${filters.radiusKm}km`];
    if (filters.gender) {
      parts.push(filters.gender);
    }
    if (filters.fitnessLevels.length) {
      parts.push(filters.fitnessLevels.join(', '));
    }
    return parts.join(' • ');
  }, [filters]);

  const handleSwipeOutcome = useCallback(
    async (cardIndex, action) => {
      const profile = items[cardIndex];
      if (!profile || !userId) {
        return;
      }

      try {
        if (action === 'pass') {
          await sendPassApi({
            token,
            userId,
            targetUserId: profile.id,
          });
        } else {
          await sendLikeApi({
            token,
            userId,
            targetUserId: profile.id,
            superLike: action === 'super',
          });
        }
      } catch (err) {
        console.warn('Swipe action failed', err); // eslint-disable-line no-console
      }
    },
    [items, token, userId],
  );

  const handleOnSwiped = () => {
    dispatch(nextProfile());
  };

  const handlePass = () => swiperRef.current?.swipeLeft();
  const handleLike = () => swiperRef.current?.swipeRight();
  const handleSuperLike = () => swiperRef.current?.swipeTop();

  const handleRefresh = () => {
    if (!userId) return;
    dispatch(resetProfiles());
    dispatch(fetchProfiles({ userId, filters }));
  };

  return (
    <BaseScreen>
      {!userId && (
        <View style={styles.authNotice}>
          <Text style={styles.error}>Sign in to discover partners.</Text>
        </View>
      )}
      <View style={styles.filtersBar}>
        <View>
          <Text style={styles.filtersLabel}>Filters</Text>
          <Text style={styles.filtersSummary}>{filterSummary}</Text>
        </View>
        <TouchableOpacity style={styles.filtersButton} onPress={() => setShowFilters((prev) => !prev)}>
          <Text style={styles.filtersButtonText}>{showFilters ? 'Hide' : 'Adjust'}</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.panelTitle}>Distance</Text>
          <View style={styles.row}>
            {radiusOptions.map((radius) => (
              <FilterChip
                key={radius}
                label={`${radius} km`}
                isActive={filters.radiusKm === radius}
                onPress={() => selectRadius(radius)}
              />
            ))}
          </View>

          <Text style={styles.panelTitle}>Gender preference</Text>
          <View style={styles.row}>
            {genderOptions.map((option) => (
              <FilterChip
                key={option.label}
                label={option.label}
                isActive={filters.gender === option.value}
                onPress={() => selectGender(option.value)}
              />
            ))}
          </View>

          <Text style={styles.panelTitle}>Fitness level</Text>
          <View style={styles.row}>
            {fitnessLevelOptions.map((level) => (
              <FilterChip
                key={level}
                label={level}
                isActive={filters.fitnessLevels.includes(level)}
                onPress={() => toggleFitnessLevel(level)}
              />
            ))}
          </View>
        </View>
      )}

      {status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {status === 'failed' && (
        <View style={styles.centered}>
          <Text style={styles.error}>{error || 'Something went wrong'}</Text>
        </View>
      )}

      {status === 'succeeded' && !currentProfile && (
        <View style={styles.centered}>
          <Text style={styles.title}>You are all caught up! 🎉</Text>
          <Text style={styles.subtitle}>Check back soon for more partners near you.</Text>
          <Text onPress={handleRefresh} style={styles.refresh}>
            Tap to refresh
          </Text>
        </View>
      )}

      {items.length > 0 && (
        <>
          <View style={styles.cardContainer}>
            <Swiper
              ref={swiperRef}
              cards={items}
              cardIndex={activeIndex}
              renderCard={(card) => <ProfileCard profile={card} />}
              onSwiped={handleOnSwiped}
              onSwipedLeft={(index) => handleSwipeOutcome(index, 'pass')}
              onSwipedRight={(index) => handleSwipeOutcome(index, 'like')}
              onSwipedTop={(index) => handleSwipeOutcome(index, 'super')}
              backgroundColor="transparent"
              stackSize={2}
              disableTopSwipe={false}
              stackScale={10}
              stackSeparation={14}
              onSwipedAll={handleRefresh}
              containerStyle={styles.swiperContainer}
              cardStyle={styles.swiperCard}
            />
          </View>
          <SwipeActions
            onPass={handlePass}
            onLike={handleLike}
            onSuperLike={handleSuperLike}
          />
        </>
      )}
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  authNotice: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filtersLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  filtersSummary: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  filtersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtersButtonText: {
    color: colors.accent,
    fontWeight: '600',
  },
  filterPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    textAlign: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
  },
  refresh: {
    color: colors.accent,
    marginTop: 12,
  },
  cardContainer: {
    flex: 1,
    marginTop: 16,
  },
  swiperContainer: {
    flex: 1,
  },
  swiperCard: {
    backgroundColor: 'transparent',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  chipText: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
});

const FilterChip = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
    ]}
  >
    <Text
      style={[
        styles.chipText,
        isActive && { color: colors.background },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default DiscoverScreen;
