import { View, Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function SectionHeader({ label, right, onPressRight }: { label: string; right?: string; onPressRight?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.xl, marginBottom: theme.space.md }}>
      <AppText variant="label" muted>{label}</AppText>
      {right ? (
        <Pressable onPress={onPressRight}>
          <AppText variant="label" style={{ color: theme.accent }}>{right}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
