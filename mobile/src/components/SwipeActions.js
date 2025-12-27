import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const SwipeActions = ({ onPass, onSuperLike, onLike }) => (
  <View style={styles.container}>
    <TouchableOpacity style={[styles.button, styles.pass]} onPress={onPass}>
      <Ionicons name="close" size={28} color={colors.danger} />
    </TouchableOpacity>
    <TouchableOpacity style={[styles.button, styles.superLike]} onPress={onSuperLike}>
      <Ionicons name="star" size={24} color={colors.accentSecondary} />
    </TouchableOpacity>
    <TouchableOpacity style={[styles.button, styles.like]} onPress={onLike}>
      <Ionicons name="heart" size={28} color={colors.success} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 24,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  pass: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  superLike: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  like: {
    borderWidth: 1,
    borderColor: colors.success,
  },
});

export default SwipeActions;
