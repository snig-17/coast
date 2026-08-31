import { Income, BudgetPlan, Pence } from '@coast/core';

export type Cadence = 'weekly' | 'monthly';

export interface CadenceAmount {
  amount: Pence;
  cadence: Cadence;
}

export interface OnboardingInput {
  incomeMonthly: Pence;
  paydayDom: number;
  essentials: CadenceAmount;
  extras: CadenceAmount;
  savingsMonthly: Pence;
  debtMonthly: Pence;
}

export function monthlyFromCadence(amount: Pence, cadence: Cadence): Pence {
  return cadence === 'weekly' ? Math.round((amount * 52) / 12) : amount;
}

export function buildOnboarding(input: OnboardingInput): { income: Income; plan: BudgetPlan } {
  const income: Income = { monthly: input.incomeMonthly, paydayDom: input.paydayDom };

  const bills = monthlyFromCadence(input.essentials.amount, input.essentials.cadence);
  const discretionary = monthlyFromCadence(input.extras.amount, input.extras.cadence);
  const lifestyle = Math.round(discretionary * 0.8);
  const joy = discretionary - lifestyle;

  const plan: BudgetPlan = {
    bills,
    savings: input.savingsMonthly,
    debt: input.debtMonthly,
    discretionary,
    essentials: 0,
    lifestyle,
    joy,
  };

  return { income, plan };
}
