import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/design/theme';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  activity: 'trending-up',
  payments: 'card',
  plan: 'pie-chart',
  profile: 'person',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.onDark,
        tabBarInactiveTintColor: '#6E6E6E',
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopWidth: 0 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={size} color={color} />
        ),
      })}
    />
  );
}
