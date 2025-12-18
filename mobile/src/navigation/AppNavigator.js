import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import DiscoverScreen from '../screens/DiscoverScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    border: colors.border,
  },
};

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarIcon: ({ color, size }) => {
        let iconName = 'home';
        if (route.name === 'Discover') iconName = 'flame';
        if (route.name === 'Matches') iconName = 'chatbubble';
        if (route.name === 'Profile') iconName = 'person';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Discover" component={DiscoverScreen} />
    <Tab.Screen name="Matches" component={MatchesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer theme={navTheme}>
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.partnerName || 'Chat',
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.textPrimary },
          headerTintColor: colors.textPrimary,
        })}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
