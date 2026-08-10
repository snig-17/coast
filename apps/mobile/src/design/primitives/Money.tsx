import { formatGBP, MoneyMode } from '@coast/core';
import { AppText } from './Text';
import { theme } from '../theme';

type Variant = keyof typeof theme.type;

export function Money({ pence, mode = 'auto', variant = 'stat' }: { pence: number; mode?: MoneyMode; variant?: Variant }) {
  return <AppText variant={variant}>{formatGBP(pence, mode)}</AppText>;
}
