import { SEED_STATE } from '@coast/core';
import {
  selectSpendRoom,
  selectPlanBreakdown,
  selectDaysUntilPayday,
  selectRecurringTotal,
  selectLeaksAnnual,
} from '../store/selectors';

const now = new Date('2026-08-09T12:00:00Z');

describe('store selectors', () => {
  it('surfaces the reference spend room from seed', () => {
    expect(selectSpendRoom(SEED_STATE, now).dailyRoom).toBe(813);
    expect(selectDaysUntilPayday(SEED_STATE, now)).toBe(22);
  });
  it('surfaces the plan donut total', () => {
    expect(selectPlanBreakdown(SEED_STATE).total).toBe(206500);
  });
  it('sums recurring payments and open leaks', () => {
    expect(selectRecurringTotal(SEED_STATE)).toBe(152000);
    expect(selectLeaksAnnual(SEED_STATE)).toBe(286000);
  });
});
