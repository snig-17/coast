import { View, Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function SegmentedToggle({
  options, value, onChange,
}: { options: [string, string]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: theme.radius.pill, padding: theme.space.xs }}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{ flex: 1, paddingVertical: theme.space.md, borderRadius: theme.radius.pill, backgroundColor: selected ? theme.text : 'transparent', alignItems: 'center' }}
          >
            <AppText variant="label" style={{ color: selected ? theme.onDark : theme.text }}>{opt}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
