import { CoastState, Statement, categoriesById } from '@coast/core';
import { payCycle, spendRoom, weeklyStatement, WeeklyStatementView } from '@coast/engine';

export function selectStatementList(state: CoastState): Statement[] {
  return state.statements;
}

export function selectStatementView(state: CoastState, statement: Statement, now: Date): WeeklyStatementView {
  const cats = categoriesById(state.categories);
  const cycle = payCycle(state.income.paydayDom, now);
  const room = spendRoom(state.plan, state.transactions, cats, cycle, now);
  const weekStart = new Date(`${statement.weekStart}T00:00:00Z`);
  const memberSince = Date.parse(`${state.memberSince}T00:00:00Z`);
  // Weeks before membership had no daily line (pre-plan); otherwise a whole-week line.
  const weeklyLine = weekStart.getTime() < memberSince ? 0 : room.dailyRoom * 7;
  return weeklyStatement({
    issueNumber: statement.issueNumber,
    weekStart,
    transactions: state.transactions,
    categoriesById: cats,
    weeklyLine,
    currentDailyRoom: room.dailyRoom,
    leaksSpotted: 0,
  });
}
