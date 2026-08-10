import { weeklyStatement } from '../weeklyStatement';
import { categoriesById, Transaction } from '@coast/core';

const cats = categoriesById();

describe('weeklyStatement', () => {
  it('renders the quiet reference week (W31) at zero', () => {
    const view = weeklyStatement({
      issueNumber: 31,
      weekStart: new Date('2026-07-27T00:00:00Z'),
      transactions: [],
      categoriesById: cats,
      weeklyLine: 0,
      currentDailyRoom: 813,
      leaksSpotted: 0,
    });
    expect(view.weekStart).toBe('2026-07-27');
    expect(view.weekEnd).toBe('2026-08-02');
    expect(view.dailyLedger).toHaveLength(7);
    expect(view.dailyLedger[0].day).toBe('MON');
    expect(view.dailyLedger.every((d) => !d.scored && d.amount === 0)).toBe(true);
    expect(view.daysScored).toBe(0);
    expect(view.daysUnder).toBe(0);
    expect(view.plannedSpend).toBe(0);
    expect(view.actualSpend).toBe(0);
    expect(view.movedForward).toBe(0);
    expect(view.result).toBe(0);
    expect(view.carry).toBe(0);
    expect(view.nextDailyLine).toBe(900); // ceil(£8.13) = £9
  });

  it('scores days against the line and moves savings forward', () => {
    const txns: Transaction[] = [
      { id: 'a', amount: 500,  categoryId: 'eating_out', date: '2026-07-28', source: 'manual' }, // Tue, under £9 line
      { id: 'b', amount: 1500, categoryId: 'shopping',   date: '2026-07-29', source: 'manual' }, // Wed, over £9 line
      { id: 'c', amount: 3000, categoryId: 'savings',    date: '2026-07-30', source: 'manual' }, // Thu, moved forward
    ];
    const view = weeklyStatement({
      issueNumber: 31,
      weekStart: new Date('2026-07-27T00:00:00Z'),
      transactions: txns,
      categoriesById: cats,
      weeklyLine: 6300, // £9 x 7
      currentDailyRoom: 900,
      leaksSpotted: 0,
    });
    expect(view.daysScored).toBe(7);
    expect(view.actualSpend).toBe(500 + 1500); // savings is a movement, not spend
    expect(view.movedForward).toBe(3000);
    expect(view.weeklyLine).toBe(6300);
    expect(view.result).toBe(6300 - 2000);
    const tue = view.dailyLedger.find((d) => d.day === 'TUE')!;
    expect(tue.scored).toBe(true);
    expect(tue.amount).toBe(500);
  });
});
