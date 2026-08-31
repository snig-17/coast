import { colors, space, radius } from '../design/tokens';
import { theme } from '../design/theme';

describe('design tokens', () => {
  it('exposes the Coast palette', () => {
    expect(colors.sand).toBe('#E9E4D8');
    expect(colors.ink).toBe('#1A1A1A');
    expect(colors.sea).toBe('#2C6E9B');
    expect(colors.tabBar).toBe('#111111');
  });
  it('has an ascending spacing scale', () => {
    const scale = [space.xs, space.sm, space.md, space.lg, space.xl, space.xxl];
    for (let i = 1; i < scale.length; i++) expect(scale[i]).toBeGreaterThan(scale[i - 1]);
  });
  it('has a pill radius', () => {
    expect(radius.pill).toBeGreaterThanOrEqual(999);
  });
});

describe('theme', () => {
  it('maps semantic roles onto palette colours', () => {
    expect(theme.bg).toBe(colors.sand);
    expect(theme.accent).toBe(colors.sea);
    expect(theme.tabBar).toBe(colors.tabBar);
    expect(theme.categoryColors.savings).toBe(colors.green);
    expect(theme.categoryColors.discretionary).toBe(colors.sea);
  });
});
