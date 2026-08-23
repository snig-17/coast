import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        { backgroundColor: theme.card, borderRadius: theme.radius.lg, padding: theme.space.xl },
        style,
      ]}
    >
      {children}
    </View>
  );
}
