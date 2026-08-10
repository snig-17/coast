import { SEED_STATE, Transaction } from '@coast/core';
import { annualLeakTotal } from '@coast/engine';
import { coastStore } from '../store/store';

beforeEach(() => coastStore.getState().hydrate(JSON.parse(JSON.stringify(SEED_STATE))));

const txn: Transaction = { id: 't_new', amount: 500, categoryId: 'eating_out', date: '2026-08-09', source: 'manual' };

describe('coastStore', () => {
  it('hydrates from a CoastState', () => {
    expect(coastStore.getState().data.income.monthly).toBe(206500);
  });
  it('prepends new transactions immutably', () => {
    const before = coastStore.getState().data.transactions.length;
    coastStore.getState().addTransaction(txn);
    const after = coastStore.getState().data.transactions;
    expect(after.length).toBe(before + 1);
    expect(after[0].id).toBe('t_new');
  });
  it('stamps a statement', () => {
    coastStore.getState().stampStatement('stmt_w31');
    expect(coastStore.getState().data.statements.find((s: any) => s.id === 'stmt_w31')!.status).toBe('stamped');
  });
  it('closes a leak and lowers the open annual total', () => {
    coastStore.getState().closeLeakById('leak_fees');
    expect(annualLeakTotal(coastStore.getState().data.leaks)).toBe(286000 - 70000);
  });
  it('completeOnboarding sets income, plan, and the flag', () => {
    coastStore.getState().completeOnboarding(
      { monthly: 300000, paydayDom: 28 },
      { bills: 100000, savings: 50000, debt: 0, discretionary: 150000, essentials: 60000, lifestyle: 60000, joy: 30000 },
    );
    const d = coastStore.getState().data;
    expect(d.onboardingComplete).toBe(true);
    expect(d.income.paydayDom).toBe(28);
    expect(d.plan.discretionary).toBe(150000);
  });
});
