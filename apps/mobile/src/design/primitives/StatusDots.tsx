import { View } from 'react-native';
import { theme } from '../theme';

export function StatusDots({ onPace }: { onPace: boolean }) {
  const color = onPace ? theme.accent : theme.overPace;
  return (
    <View style={{ flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.lg }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 56, height: 56, borderRadius: theme.radius.pill, backgroundColor: color }} />
      ))}
    </View>
  );
}
