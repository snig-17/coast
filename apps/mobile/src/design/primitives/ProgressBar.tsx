import { View } from 'react-native';
import { theme } from '../theme';

export function ProgressBar({ fraction, color }: { fraction: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, fraction));
  return (
    <View style={{ height: 6, borderRadius: theme.radius.pill, backgroundColor: theme.line, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? theme.accent, borderRadius: theme.radius.pill }} />
    </View>
  );
}
