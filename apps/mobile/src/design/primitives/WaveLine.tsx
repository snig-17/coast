import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';

// Continuous fine-line wave motif. Two smooth periods, sea blue by default.
export function WaveLine({ width = 120, height = 14, color = theme.sea, strokeWidth = 2 }: { width?: number; height?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 16" fill="none">
      <Path
        d="M0 8 C 8 1, 17 1, 25 8 S 42 15, 50 8 S 67 1, 75 8 S 92 15, 100 8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
