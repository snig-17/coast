import { planBreakdown } from '../planBreakdown';
import { SEED_STATE } from '@coast/core';

describe('planBreakdown', () => {
  it('totals the four groups and shares each as a fraction', () => {
    const b = planBreakdown(SEED_STATE.plan);
    expect(b.total).toBe(206500);
    const bills = b.segments.find((s) => s.group === 'bills')!;
    expect(bills.amount).toBe(152000);
    expect(bills.pct).toBeCloseTo(152000 / 206500, 6);
    expect(b.segments.map((s) => s.group)).toEqual(['bills', 'savings', 'debt', 'discretionary']);
  });
  it('is safe when the plan is empty', () => {
    const b = planBreakdown({ bills: 0, savings: 0, debt: 0, discretionary: 0, essentials: 0, lifestyle: 0, joy: 0 });
    expect(b.total).toBe(0);
    expect(b.segments.every((s) => s.pct === 0)).toBe(true);
  });
});
