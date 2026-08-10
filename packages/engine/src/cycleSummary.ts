import { Transaction, Category, BudgetPlan, Income, CategoryGroup, Pence } from '@coast/core';
import { PayCycle } from './payCycle';

export interface GroupSpend {
  group: CategoryGroup;
  spent: Pence;
  allocated: Pence;
  pctOfIncome: number;
}

export interface CycleSummary {
  totalSpent: Pence;
  pctOfIncome: number;
  groups: GroupSpend[];
}

const DISPLAY_GROUPS: CategoryGroup[] = ['discretionary', 'bills', 'savings'];

function inCycle(t: Transaction, cycle: PayCycle): boolean {
  const d = Date.parse(`${t.date}T00:00:00Z`);
  return d >= cycle.start.getTime() && d < cycle.nextPayday.getTime();
}

export function cycleSummary(
  transactions: Transaction[],
  categoriesById: Record<string, Category>,
  plan: BudgetPlan,
  income: Income,
  cycle: PayCycle,
): CycleSummary {
  const scoped = transactions.filter((t) => inCycle(t, cycle));
  const allocByGroup: Record<CategoryGroup, Pence> = {
    bills: plan.bills,
    savings: plan.savings,
    debt: plan.debt,
    discretionary: plan.discretionary,
  };

  const groups = DISPLAY_GROUPS.map((group) => {
    const spent = scoped
      .filter((t) => categoriesById[t.categoryId]?.group === group)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      group,
      spent,
      allocated: allocByGroup[group],
      pctOfIncome: income.monthly === 0 ? 0 : spent / income.monthly,
    };
  });

  const totalSpent = groups.reduce((sum, g) => sum + g.spent, 0);
  return {
    totalSpent,
    pctOfIncome: income.monthly === 0 ? 0 : totalSpent / income.monthly,
    groups,
  };
}
