import { View } from 'react-native';
import { theme } from '../theme';

export function PaydayDots({ total, elapsed }: { total: number; elapsed: number }) {
  const count = Math.min(Math.max(total, 0), 31);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ width: 10, height: 10, borderRadius: theme.radius.pill, backgroundColor: i < elapsed ? theme.text : theme.line }}
        />
      ))}
    </View>
  );
}
