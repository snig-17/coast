import { BudgetPlan, Pence } from '@coast/core';

export interface PlanSegment {
  group: 'bills' | 'savings' | 'debt' | 'discretionary';
  amount: Pence;
  pct: number;
}

export interface PlanBreakdown {
  segments: PlanSegment[];
  total: Pence;
}

export function planBreakdown(plan: BudgetPlan): PlanBreakdown {
  const entries: [PlanSegment['group'], Pence][] = [
    ['bills', plan.bills],
    ['savings', plan.savings],
    ['debt', plan.debt],
    ['discretionary', plan.discretionary],
  ];
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  const segments = entries.map(([group, amount]) => ({
    group,
    amount,
    pct: total === 0 ? 0 : amount / total,
  }));
  return { segments, total };
}
