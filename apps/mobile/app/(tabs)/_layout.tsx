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

// Names from Plan 2 (the app shell). Home and Profile read from their glyphs;
// a pie, a trend line and a card do not say Plan, Activity and Payments on
// their own, and the tab bar is the app's only wayfinding.
const LABELS: Record<string, string> = {
  index: 'Home',
  activity: 'Activity',
  payments: 'Payments',
  plan: 'Plan',
  profile: 'Profile',
};

export default function TabsLayout() {
  const onboardingComplete = useCoastStore((s) => s.data.onboardingComplete);
  if (!onboardingComplete) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        title: LABELS[route.name] ?? route.name,
        tabBarActiveTintColor: theme.onDark,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopWidth: 0 },
        // The label token is 13px, which is too heavy for five items across a
        // phone; 11px keeps the family and weight and fits "Payments".
        tabBarLabelStyle: {
          fontFamily: theme.type.label.family,
          fontSize: 11,
          fontWeight: theme.type.label.weight,
          letterSpacing: 0.2,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={size} color={color} />
        ),
      })}
    />
  );
}
