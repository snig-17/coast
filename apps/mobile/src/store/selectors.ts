import { CoastState, categoriesById, Pence } from '@coast/core';
import {
  payCycle, PayCycle,
  spendRoom, SpendRoom,
  cycleSummary, CycleSummary,
  planBreakdown, PlanBreakdown,
  annualLeakTotal, leaksClosedAnnual,
} from '@coast/engine';

export function selectPayCycle(state: CoastState, now: Date): PayCycle {
  return payCycle(state.income.paydayDom, now);
}

export function selectSpendRoom(state: CoastState, now: Date): SpendRoom {
  return spendRoom(
    state.plan,
    state.transactions,
    categoriesById(state.categories),
    selectPayCycle(state, now),
    now,
  );
}

export function selectCycleSummary(state: CoastState, now: Date): CycleSummary {
  return cycleSummary(
    state.transactions,
    categoriesById(state.categories),
    state.plan,
    state.income,
    selectPayCycle(state, now),
  );
}

export function selectPlanBreakdown(state: CoastState): PlanBreakdown {
  return planBreakdown(state.plan);
}

export function selectDaysUntilPayday(state: CoastState, now: Date): number {
  return selectPayCycle(state, now).daysUntilPayday;
}

export function selectRecurringTotal(state: CoastState): Pence {
  return state.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function selectLeaksAnnual(state: CoastState): Pence {
  return annualLeakTotal(state.leaks);
}

export function selectLeaksClosedAnnual(state: CoastState): Pence {
  return leaksClosedAnnual(state.leaks);
}
