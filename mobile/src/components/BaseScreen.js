import { SafeAreaView, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const BaseScreen = ({ children, style }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={[styles.container, style]}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.background,
  },
});

export default BaseScreen;
