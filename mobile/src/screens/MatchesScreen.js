import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import BaseScreen from '../components/BaseScreen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMatches } from '../store/slices/matchesSlice';
import { fetchMessages, setActiveMatch } from '../store/slices/chatSlice';
import { colors, spacing, typography } from '../theme';

const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?background=1F242A&color=fff&name=${encodeURIComponent(name)}`;

const MatchesScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { items, status, error } = useAppSelector((state) => state.matches);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMatches());
    }
  }, [dispatch, status]);

  const handleOpenChat = (match) => {
    dispatch(setActiveMatch(match.id));
    dispatch(fetchMessages(match.id));
    navigation.navigate('Chat', {
      matchId: match.id,
      partnerName: match.partner?.name,
      partnerId: match.partner?.id,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOpenChat(item)}>
      <Image source={{ uri: avatarUrl(item.partner?.name || 'Gymate') }} style={styles.avatar} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.partner?.name || 'Partner'}</Text>
          <Text style={styles.timestamp}>Matched {Math.floor((Date.now() - item.createdAt) / 3600000)}h ago</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {item.lastMessage || 'Say hi and plan your next session!'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <BaseScreen>
      {status === 'loading' && (
        <View style={styles.centered}>
          <Text style={styles.subtitle}>Loading your matches...</Text>
        </View>
      )}

      {status === 'failed' && (
        <View style={styles.centered}>
          <Text style={styles.error}>{error || 'Unable to load matches'}</Text>
        </View>
      )}

      {status === 'succeeded' && !items.length && (
        <View style={styles.centered}>
          <Text style={styles.title}>No matches yet</Text>
          <Text style={styles.subtitle}>Keep swiping to find your perfect workout partner.</Text>
        </View>
      )}

      {items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  list: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.subheading,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  preview: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
  },
});

export default MatchesScreen;
