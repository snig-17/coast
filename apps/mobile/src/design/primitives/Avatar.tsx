import { View } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function Avatar({ initial, size = 96 }: { initial: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: theme.radius.pill, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="title" style={{ color: theme.onDark }}>{initial.slice(0, 1).toUpperCase()}</AppText>
    </View>
  );
}
