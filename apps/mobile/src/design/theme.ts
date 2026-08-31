import { colors, space, radius, type } from './tokens';

export const theme = {
  bg: colors.sand,
  card: colors.card,
  text: colors.ink,
  textMuted: colors.inkMuted,
  accent: colors.sea,
  sea: colors.sea,
  line: colors.line,
  tabBar: colors.tabBar,
  onDark: colors.onDark,
  tabInactive: colors.tabInactive,
  overPace: colors.overPace,
  categoryColors: {
    bills: colors.ink,
    savings: colors.green,
    debt: colors.amber,
    discretionary: colors.sea,
  },
  space,
  radius,
  type,
} as const;

export type Theme = typeof theme;
