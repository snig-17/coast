import { spendRoom } from '../spendRoom';
import { payCycle } from '../payCycle';
import { SEED_STATE, categoriesById, Transaction } from '@coast/core';

const cats = categoriesById();
const ref = new Date('2026-08-09T12:00:00Z');
const cycle = payCycle(31, ref);

describe('spendRoom', () => {
  it('matches the reference screen: £178.86 left -> £8.13/day', () => {
    const r = spendRoom(SEED_STATE.plan, [], cats, cycle, ref);
    expect(r.leftUntilPayday).toBe(17886);
    expect(r.dailyRoom).toBe(813);
    expect(r.spentToday).toBe(0);
    expect(r.onPace).toBe(true);
  });
  it('only lifestyle spending reduces the room; today spend is tracked', () => {
    const txns: Transaction[] = [
      { id: 't1', amount: 1000, categoryId: 'eating_out',    date: '2026-08-09', source: 'manual' }, // lifestyle, today
      { id: 't2', amount: 5000, categoryId: 'utilities',     date: '2026-08-09', source: 'manual' }, // bills -> ignored
      { id: 't3', amount: 2000, categoryId: 'subscriptions', date: '2026-08-08', source: 'manual' }, // joy -> ignored
    ];
    const r = spendRoom(SEED_STATE.plan, txns, cats, cycle, ref);
    expect(r.leftUntilPayday).toBe(17886 - 1000);
    expect(r.spentToday).toBe(1000);
    expect(r.dailyRoom).toBe(Math.floor((17886 - 1000) / 22));
  });
  it('never goes negative when lifestyle is overspent', () => {
    const txns: Transaction[] = [
      { id: 't1', amount: 20000, categoryId: 'shopping', date: '2026-08-02', source: 'manual' },
    ];
    const r = spendRoom(SEED_STATE.plan, txns, cats, cycle, ref);
    expect(r.leftUntilPayday).toBe(0);
    expect(r.dailyRoom).toBe(0);
  });
});
