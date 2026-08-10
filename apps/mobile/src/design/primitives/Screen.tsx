import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[{ flex: 1, paddingHorizontal: theme.space.xl }, style]}>{children}</View>
    </SafeAreaView>
  );
}
