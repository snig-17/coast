import { Transaction, Category, BudgetPlan, Pence } from '@coast/core';
import { PayCycle } from './payCycle';

export interface SpendRoom {
  dailyRoom: Pence;
  leftUntilPayday: Pence;
  spentToday: Pence;
  onPace: boolean;
}

function isLifestyle(t: Transaction, cats: Record<string, Category>): boolean {
  return cats[t.categoryId]?.subpool === 'lifestyle';
}

export function spendRoom(
  plan: BudgetPlan,
  transactions: Transaction[],
  categoriesById: Record<string, Category>,
  cycle: PayCycle,
  ref: Date,
): SpendRoom {
  const startMs = cycle.start.getTime();
  const endMs = cycle.nextPayday.getTime();
  const refIso = ref.toISOString().slice(0, 10);

  const lifestyleSpent = transactions
    .filter((t) => isLifestyle(t, categoriesById))
    .filter((t) => {
      const d = Date.parse(`${t.date}T00:00:00Z`);
      return d >= startMs && d < endMs;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const leftUntilPayday = Math.max(0, plan.lifestyle - lifestyleSpent);
  const dailyRoom =
    cycle.daysUntilPayday > 0 ? Math.floor(leftUntilPayday / cycle.daysUntilPayday) : leftUntilPayday;

  const spentToday = transactions
    .filter((t) => t.date === refIso && isLifestyle(t, categoriesById))
    .reduce((sum, t) => sum + t.amount, 0);

  return { dailyRoom, leftUntilPayday, spentToday, onPace: spentToday <= dailyRoom };
}
