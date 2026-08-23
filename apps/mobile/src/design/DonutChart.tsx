import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { PlanBreakdown } from '@coast/engine';
import { donutStrokes } from '../viz/geometry';
import { theme } from './theme';
import { AppText } from './primitives/Text';
import { Money } from './primitives/Money';

export function DonutChart({
  breakdown,
  size = 240,
  strokeWidth = 34,
  topLabel,
  centerPence,
}: {
  breakdown: PlanBreakdown;
  size?: number;
  strokeWidth?: number;
  topLabel?: string;
  centerPence?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokes = donutStrokes(breakdown.segments, radius);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle cx={center} cy={center} r={radius} stroke={theme.line} strokeWidth={strokeWidth} fill="none" />
          {strokes.map((s, i) =>
            s.length > 0 ? (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                stroke={theme.categoryColors[s.group]}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${s.length} ${circumference - s.length}`}
                strokeDashoffset={-s.offset}
              />
            ) : null,
          )}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {topLabel ? <AppText variant="label" muted>{topLabel}</AppText> : null}
        {centerPence != null ? <Money pence={centerPence} variant="stat" /> : null}
      </View>
    </View>
  );
}
