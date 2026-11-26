import { View } from 'react-native';
import { theme } from '../theme';
import { Shell } from './Shell';

export function StatusDots({ onPace }: { onPace: boolean }) {
  const color = onPace ? theme.sea : theme.overPace;
  // One mark, not three. The pace state is a single bit, so repeating the brand
  // mark to carry it was decoration — and it spent the wordmark's impact twice over.
  return (
    <View style={{ flexDirection: 'row', marginTop: theme.space.lg }}>
      <Shell size={52} color={color} />
    </View>
  );
}
