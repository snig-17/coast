import { useState } from 'react';
import { Alert, ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useCoastStore } from '../src/store/store';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { theme } from '../src/design/theme';

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
      <AppText variant="title" style={{ fontSize: 20, lineHeight: 24, color: danger ? theme.overPace : theme.text }}>{label}</AppText>
      <AppText variant="title" style={{ color: danger ? theme.overPace : theme.accent }}>›</AppText>
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const profileName = useCoastStore((s) => s.data.profileName);
  const setProfileName = useCoastStore((s) => s.setProfileName);
  const reset = useCoastStore((s) => s.reset);

  const [name, setName] = useState(profileName);

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed.length > 0) setProfileName(trimmed);
    else setName(profileName);
  };

  const confirmReset = () =>
    Alert.alert(
      'Reset app data',
      'This restores the demo data and clears anything you’ve added. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => { reset(); router.back(); } },
      ],
    );

  const version = Constants.expoConfig?.version ?? '0.0.1';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <Pressable onPress={() => router.back()}><AppText variant="label" muted>Done</AppText></Pressable>
        <AppText variant="label" muted>SETTINGS</AppText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>DISPLAY NAME</AppText>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={commitName}
          onBlur={commitName}
          returnKeyType="done"
          placeholder="Your name"
          placeholderTextColor={theme.textMuted}
          style={{ fontFamily: theme.type.title.family, fontSize: theme.type.title.size, color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.sm }}
        />

        <Row label="Redo onboarding" onPress={() => router.push('/onboarding')} />
        <Row label="Reset app data" onPress={confirmReset} danger />

        <View style={{ marginTop: theme.space.xxl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
          <AppText variant="label" muted>ABOUT</AppText>
          <AppText variant="body" style={{ marginTop: theme.space.sm }}>Coast · v{version}</AppText>
          <AppText variant="body" muted style={{ marginTop: theme.space.xs }}>Everything lives on your device. No accounts, no servers.</AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}
