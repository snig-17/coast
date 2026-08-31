import { View } from 'react-native';
import { theme } from '../theme';
import { Shell } from './Shell';

export function StatusDots({ onPace }: { onPace: boolean }) {
  const color = onPace ? theme.sea : theme.overPace;
  return (
    <View style={{ flexDirection: 'row', gap: theme.space.lg, marginTop: theme.space.lg }}>
      {[0, 1, 2].map((i) => (
        <Shell key={i} size={52} color={color} />
      ))}
    </View>
  );
}
