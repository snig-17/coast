import { Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function PillButton({ label, onPress, variant = 'dark' }: { label: string; onPress?: () => void; variant?: 'dark' | 'accent' }) {
  const bg = variant === 'accent' ? theme.accent : theme.text;
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: bg, borderRadius: theme.radius.pill, paddingVertical: theme.space.lg, paddingHorizontal: theme.space.xxl, alignItems: 'center' }}
    >
      <AppText variant="label" style={{ color: theme.onDark }}>{label}</AppText>
    </Pressable>
  );
}
