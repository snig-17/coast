import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/design/theme';
import { useCoastStore } from '../../src/store/store';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  activity: 'trending-up',
  payments: 'card',
  plan: 'pie-chart',
  profile: 'person',
};

export default function TabsLayout() {
  const onboardingComplete = useCoastStore((s) => s.data.onboardingComplete);
  if (!onboardingComplete) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.onDark,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopWidth: 0 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={size} color={color} />
        ),
      })}
    />
  );
}
