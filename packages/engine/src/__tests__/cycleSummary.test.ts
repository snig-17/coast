import { cycleSummary } from '../cycleSummary';
import { payCycle } from '../payCycle';
import { SEED_STATE, categoriesById, Transaction } from '@coast/core';

const cats = categoriesById();
const cycle = payCycle(31, new Date('2026-08-09T12:00:00Z'));

describe('cycleSummary', () => {
  it('is all zeroes for an empty cycle', () => {
    const s = cycleSummary([], cats, SEED_STATE.plan, SEED_STATE.income, cycle);
    expect(s.totalSpent).toBe(0);
    expect(s.pctOfIncome).toBe(0);
    expect(s.groups.map((g) => g.group)).toEqual(['discretionary', 'bills', 'savings']);
    expect(s.groups.every((g) => g.spent === 0 && g.pctOfIncome === 0)).toBe(true);
  });
  it('sums only in-cycle transactions by group', () => {
    const txns: Transaction[] = [
      { id: 't1', amount: 2000, categoryId: 'eating_out', date: '2026-08-05', source: 'manual' }, // in cycle, discretionary
      { id: 't2', amount: 5000, categoryId: 'utilities',  date: '2026-08-06', source: 'manual' }, // in cycle, bills
      { id: 't3', amount: 9999, categoryId: 'eating_out', date: '2026-07-01', source: 'manual' }, // before cycle -> excluded
    ];
    const s = cycleSummary(txns, cats, SEED_STATE.plan, SEED_STATE.income, cycle);
    expect(s.totalSpent).toBe(7000);
    expect(s.groups.find((g) => g.group === 'discretionary')!.spent).toBe(2000);
    expect(s.groups.find((g) => g.group === 'bills')!.spent).toBe(5000);
    expect(s.pctOfIncome).toBeCloseTo(7000 / 206500, 6);
  });
});
