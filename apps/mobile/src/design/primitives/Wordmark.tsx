import { View, Text } from 'react-native';
import { theme } from '../theme';
import { SCRIPT_FAMILY } from '../fonts';
import { WaveLine } from './WaveLine';

// Cursive "Coast" brand wordmark with an optional fine-line wave.
export function Wordmark({ size = 34, color = theme.sea, wave = true }: { size?: number; color?: string; wave?: boolean }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Text style={{ fontFamily: SCRIPT_FAMILY, fontSize: size, lineHeight: size * 1.15, color }}>coast</Text>
      {wave ? <View style={{ marginTop: -size * 0.12 }}><WaveLine width={size * 1.7} height={size * 0.24} color={color} strokeWidth={1.5} /></View> : null}
    </View>
  );
}
