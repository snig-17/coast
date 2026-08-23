import { Pressable } from 'react-native';
import { Card } from './Card';
import { AppText } from './Text';
import { theme } from '../theme';

export function InfoCard({
  title, body, onDismiss, dismissLabel = 'Got it',
}: { title: string; body: string; onDismiss: () => void; dismissLabel?: string }) {
  return (
    <Card>
      <AppText variant="label" style={{ color: theme.accent }}>{title}</AppText>
      <AppText variant="body" style={{ marginTop: theme.space.md }}>{body}</AppText>
      <Pressable onPress={onDismiss} style={{ marginTop: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>{dismissLabel}</AppText>
      </Pressable>
    </Card>
  );
}
