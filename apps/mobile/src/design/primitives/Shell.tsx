import Svg, { Path, Line } from 'react-native-svg';
import { theme } from '../theme';

// Fine-line scallop shell. Continuous outline + radiating ribs.
export function Shell({ size = 56, color = theme.sea, strokeWidth = 2.4 }: { size?: number; color?: string; strokeWidth?: number }) {
  const ribs: [number, number][] = [
    [12, 40],
    [31, 22],
    [50, 16],
    [69, 22],
    [88, 40],
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M50 88 C18 84 6 54 12 40 Q50 6 88 40 C94 54 82 84 50 88 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {ribs.map(([x, y], i) => (
        <Line key={i} x1={50} y1={88} x2={x} y2={y} stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" />
      ))}
    </Svg>
  );
}
