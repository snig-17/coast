import { SEED_STATE } from '@coast/core';
import { billingsForMonth, upcomingBillings } from '../store/payments';

describe('billings', () => {
  it('sorts seed billings by day for August 2026', () => {
    const b = billingsForMonth(SEED_STATE.payments, 2026, 7);
    expect(b.map((x) => x.day)).toEqual([1, 5, 15, 20]);
    expect(b[0].iso).toBe('2026-08-01');
  });
  it('upcoming keeps only billings on/after a given day', () => {
    const up = upcomingBillings(SEED_STATE.payments, 2026, 7, 9);
    expect(up.map((x) => x.day)).toEqual([15, 20]);
  });
  it('clamps a day-31 billing into a short month', () => {
    const b = billingsForMonth([{ id: 'x', name: 'X', amount: 100, cadence: 'monthly', billingDay: 31, categoryId: 'rent' }], 2026, 1);
    expect(b[0].day).toBe(28);
  });
});
