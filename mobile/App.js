import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import store from './src/store';
import { colors } from './src/theme';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { hydrateAuth } from './src/store/slices/authSlice';

const ONBOARDING_KEY = 'gymate:onboarding_complete';

const Root = () => {
  const dispatch = useAppDispatch();
  const { token, hydrateStatus } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboardingComplete(value === 'true');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    dispatch(hydrateAuth());
  }, [dispatch, loadStatus]);

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingComplete(true);
  };

  if (loading || hydrateStatus === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingScreen onComplete={handleComplete} />;
  }

  if (!token) {
    return <AuthScreen />;
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <Root />
    </Provider>
  );
}
