import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/design/theme';
import { useCoastStore } from '../../src/store/store';

/**
 * Tab order, left to right. expo-router derives its own order from the route
 * files, which put Profile in the centre slot — the most prominent position in
 * a five-tab bar — and pushed Activity and Payments to the edge. Declaring the
 * screens below in this order fixes that.
 *
 * The order is Plan 2's, which the old ICONS map was already written in:
 * Home, Activity, Payments, Plan, Profile. Profile goes last, where iOS puts
 * the account tab.
 *
 * Names come from Plan 2 too. Home and Profile read from their glyphs; a pie, a
 * trend line and a card do not say Plan, Activity and Payments on their own, and
 * the tab bar is the app's only wayfinding.
 */
const TABS: { name: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'activity', label: 'Activity', icon: 'trending-up' },
  { name: 'payments', label: 'Payments', icon: 'card' },
  { name: 'plan', label: 'Plan', icon: 'pie-chart' },
  { name: 'profile', label: 'Profile', icon: 'person' },
];

export default function TabsLayout() {
  const onboardingComplete = useCoastStore((s) => s.data.onboardingComplete);
  if (!onboardingComplete) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.label,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
