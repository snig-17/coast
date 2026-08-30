import { Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function HeaderPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: theme.card, borderRadius: theme.radius.pill, paddingVertical: theme.space.sm, paddingHorizontal: theme.space.lg }}
    >
      <AppText variant="label">{label}</AppText>
    </Pressable>
  );
}
