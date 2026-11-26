import { useEffect, useState } from 'react';
import { formatGBP, MoneyMode, Pence } from '@coast/core';
import { useSharedValue, useAnimatedReaction, withTiming, runOnJS } from 'react-native-reanimated';
import { AppText } from './Text';
import { theme } from '../theme';
import { motion, useReducedMotion } from '../motion';

type Variant = keyof typeof theme.type;

/**
 * Money that counts to its figure instead of appearing at it.
 *
 * Reserved for a screen's headline number — the one the reader came for. Using
 * it on every figure would turn the page into a slot machine, so ordinary
 * amounts stay with <Money>.
 *
 * The text itself is re-rendered rather than animated: a currency string is not
 * a transform, and interpolating the glyphs is the only honest way to show a
 * number moving. Reduced motion skips straight to the final value.
 */
export function CountingMoney({
  pence,
  mode = 'auto',
  variant = 'hero',
  duration = motion.duration.settle,
}: {
  pence: Pence;
  mode?: MoneyMode;
  variant?: Variant;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(pence);
  const [shown, setShown] = useState(pence);

  useEffect(() => {
    if (reduced) {
      progress.value = pence;
      setShown(pence);
      return;
    }
    progress.value = withTiming(pence, { duration, easing: motion.easing.enter });
  }, [pence, reduced, duration, progress]);

  useAnimatedReaction(
    () => Math.round(progress.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setShown)(current);
    },
    [],
  );

  return <AppText variant={variant}>{formatGBP(reduced ? pence : shown, mode)}</AppText>;
}
