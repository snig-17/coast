import { SEED_STATE } from '@coast/core';
import { selectStatementView, selectStatementList } from '../store/statement';

const now = new Date('2026-08-09T12:00:00Z');

describe('statement selectors', () => {
  it('lists the seeded statements', () => {
    expect(selectStatementList(SEED_STATE).map((s) => s.id)).toEqual(['stmt_w31']);
  });
  it('builds the quiet W31 view (issue 31, next daily line £9, all zero)', () => {
    const view = selectStatementView(SEED_STATE, SEED_STATE.statements[0], now);
    expect(view.issueNumber).toBe(31);
    expect(view.weekStart).toBe('2026-07-27');
    expect(view.actualSpend).toBe(0);
    expect(view.movedForward).toBe(0);
    expect(view.result).toBe(0);
    expect(view.nextDailyLine).toBe(900);
    expect(view.dailyLedger).toHaveLength(7);
  });
});
