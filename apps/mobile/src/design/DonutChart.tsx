import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, type SharedValue } from 'react-native-reanimated';
import { PlanBreakdown } from '@coast/engine';
import { donutStrokes, DonutStroke } from '../viz/geometry';
import { theme } from './theme';
import { AppText } from './primitives/Text';
import { Money } from './primitives/Money';
import { motion, useReducedMotion } from './motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * One arc of the donut. Each segment keeps its own place on the ring and grows
 * from nothing to its full length, so the chart assembles in reading order
 * rather than fading in whole.
 */
function Arc({
  stroke,
  center,
  radius,
  strokeWidth,
  circumference,
  progress,
}: {
  stroke: DonutStroke;
  center: number;
  radius: number;
  strokeWidth: number;
  circumference: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => {
    const drawn = stroke.length * progress.value;
    return { strokeDasharray: [drawn, circumference - drawn] as number[] };
  });

  return (
    <AnimatedCircle
      cx={center}
      cy={center}
      r={radius}
      stroke={theme.categoryColors[stroke.group]}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDashoffset={-stroke.offset}
      animatedProps={animatedProps}
    />
  );
}

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
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: motion.duration.draw, easing: motion.easing.enter });
  }, [reduced, progress, breakdown]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle cx={center} cy={center} r={radius} stroke={theme.line} strokeWidth={strokeWidth} fill="none" />
          {strokes.map((s, i) =>
            s.length > 0 ? (
              <Arc
                key={i}
                stroke={s}
                center={center}
                radius={radius}
                strokeWidth={strokeWidth}
                circumference={circumference}
                progress={progress}
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
