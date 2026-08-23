import { View } from 'react-native';
import { AppText } from './Text';
import { Money } from './Money';
import { ProgressBar } from './ProgressBar';
import { theme } from '../theme';

export function CategoryRow({
  color, name, pence, pctLabel, fraction,
}: { color: string; name: string; pence: number; pctLabel: string; fraction: number }) {
  return (
    <View style={{ paddingVertical: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
          <View style={{ width: 12, height: 12, borderRadius: theme.radius.pill, backgroundColor: color }} />
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>{name}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
          <Money pence={pence} variant="body" />
          <AppText variant="body" muted>{pctLabel}</AppText>
        </View>
      </View>
      <View style={{ marginTop: theme.space.md }}>
        <ProgressBar fraction={fraction} color={color} />
      </View>
    </View>
  );
}
