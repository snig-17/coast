import { CoastState, Transaction, categoriesById } from '@coast/core';
import { payCycle, PayCycle, cycleSummary, CycleSummary } from '@coast/engine';

const MS_PER_DAY = 86_400_000;

export function cycleAtOffset(paydayDom: number, now: Date, offset: number): PayCycle {
  let cycle = payCycle(paydayDom, now);
  let remaining = offset;
  while (remaining < 0) {
    cycle = payCycle(paydayDom, new Date(cycle.start.getTime() - MS_PER_DAY));
    remaining += 1;
  }
  while (remaining > 0) {
    cycle = payCycle(paydayDom, new Date(cycle.nextPayday.getTime()));
    remaining -= 1;
  }
  return cycle;
}

export function selectPayCycleAtOffset(state: CoastState, now: Date, offset: number): PayCycle {
  return cycleAtOffset(state.income.paydayDom, now, offset);
}

export function selectCycleSummaryAtOffset(state: CoastState, now: Date, offset: number): CycleSummary {
  return cycleSummary(
    state.transactions,
    categoriesById(state.categories),
    state.plan,
    state.income,
    selectPayCycleAtOffset(state, now, offset),
  );
}

export function selectCycleTransactions(state: CoastState, now: Date, offset: number): Transaction[] {
  const cycle = selectPayCycleAtOffset(state, now, offset);
  const start = cycle.start.getTime();
  const end = cycle.nextPayday.getTime();
  return state.transactions.filter((t) => {
    const d = Date.parse(`${t.date}T00:00:00Z`);
    return d >= start && d < end;
  });
}
