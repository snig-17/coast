import { Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        right: theme.space.xl,
        bottom: theme.space.xl,
        width: 60,
        height: 60,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="title" style={{ color: theme.onDark }}>+</AppText>
    </Pressable>
  );
}
