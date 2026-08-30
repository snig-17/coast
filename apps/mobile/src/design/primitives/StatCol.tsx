import { View } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function StatCol({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View>
      <AppText variant="label" muted>{label}</AppText>
      <AppText variant="stat" style={{ color: valueColor ?? theme.text, marginTop: theme.space.xs }}>{value}</AppText>
    </View>
  );
}
