import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens. Durations stay inside 50–700ms; anything slower reads as lag
 * rather than intent. Easings are deliberately few:
 *
 *   enter — ease-out. Things arrive fast and settle. The default.
 *   move  — ease-in-out, for something already on screen changing position.
 *
 * There is no ease-in: nothing in Coast should accelerate away from the reader.
 */
export const motion = {
  duration: {
    /** A value ticking over, a chip filling. Felt, not watched. */
    quick: 180,
    /** A screen's primary number settling, a step sliding in. */
    settle: 320,
    /** The donut drawing itself — the one place a longer beat is earned. */
    draw: 620,
  },
  easing: {
    enter: Easing.out(Easing.cubic),
    move: Easing.inOut(Easing.quad),
  },
} as const;

/**
 * True when the reader has asked the system to reduce motion. Every animation
 * in the app checks this and snaps to its end state instead — the information
 * is never carried by the movement alone.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
