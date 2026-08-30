import { ScrollView, View, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Card } from '../src/design/primitives/Card';
import { PillButton } from '../src/design/primitives/PillButton';
import { theme } from '../src/design/theme';

const TEMPLATE = 'coast://add?amount=[Amount]&note=[Note]';

const STEPS = [
  'Open the Shortcuts app and tap + to create a new shortcut.',
  'Add an "Ask for Input" action for the amount, and another for a note (both optional).',
  'Add an "Open URLs" action and paste the Coast link below, dropping the Ask results into [Amount] and [Note].',
  'Name it "Log in Coast" and add it to your Home Screen or the Action button.',
  'Tapping it opens Coast with the amount pre-filled — just hit Save.',
];

export default function Automate() {
  const router = useRouter();
  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginTop: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>‹ Back</AppText>
      </Pressable>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="title" style={{ marginTop: theme.space.md }}>Automate logging</AppText>
        <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>
          Coast can't read your bank or Apple Pay automatically — Apple doesn't allow it. But an iOS Shortcut can hand a payment straight to Coast in one tap.
        </AppText>

        <View style={{ marginTop: theme.space.xl }}>
          {STEPS.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.lg }}>
              <AppText variant="title" style={{ color: theme.accent, fontSize: 20, lineHeight: 24 }}>{i + 1}</AppText>
              <AppText variant="body" style={{ flex: 1 }}>{s}</AppText>
            </View>
          ))}
        </View>

        <Card>
          <AppText variant="label" muted>COAST LINK</AppText>
          <AppText variant="body" selectable style={{ marginTop: theme.space.sm }}>{TEMPLATE}</AppText>
          <View style={{ marginTop: theme.space.lg }}>
            <PillButton label="COPY LINK" onPress={() => Clipboard.setStringAsync(TEMPLATE)} />
          </View>
        </Card>

        <AppText variant="body" muted style={{ marginTop: theme.space.xl }}>
          Tip: iOS can also run a shortcut automatically when you pay with a chosen card (Shortcuts → Automation → Transaction). Depending on your iOS version it may still ask you to type the amount.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
