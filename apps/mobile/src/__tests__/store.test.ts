import { SEED_STATE, Statement, Transaction } from '@coast/core';
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
  it('addTransactions prepends a block preserving order', () => {
    const before = coastStore.getState().data.transactions.length;
    const a: Transaction = { id: 'imp_a', amount: 100, categoryId: 'food', date: '2026-08-01', source: 'import' };
    const b: Transaction = { id: 'imp_b', amount: 200, categoryId: 'food', date: '2026-08-02', source: 'import' };
    coastStore.getState().addTransactions([a, b]);
    const after = coastStore.getState().data.transactions;
    expect(after.length).toBe(before + 2);
    expect(after.slice(0, 2).map((t) => t.id)).toEqual(['imp_a', 'imp_b']);
  });
  it('addTransactions with an empty array is a no-op', () => {
    const before = coastStore.getState().data.transactions.length;
    coastStore.getState().addTransactions([]);
    expect(coastStore.getState().data.transactions.length).toBe(before);
  });
  it('addPayment prepends a payment', () => {
    const before = coastStore.getState().data.payments.length;
    const p = { id: 'pay_new', name: 'Gym', amount: 3000, cadence: 'monthly' as const, billingDay: 3, categoryId: 'rent' };
    coastStore.getState().addPayment(p);
    const after = coastStore.getState().data.payments;
    expect(after.length).toBe(before + 1);
    expect(after[0].id).toBe('pay_new');
  });
  it('setProfileName updates the profile name', () => {
    coastStore.getState().setProfileName('Sam');
    expect(coastStore.getState().data.profileName).toBe('Sam');
  });
  it('stamps a statement', () => {
    coastStore.getState().stampStatement('stmt_w31');
    expect(coastStore.getState().data.statements.find((s: Statement) => s.id === 'stmt_w31')!.status).toBe('stamped');
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
