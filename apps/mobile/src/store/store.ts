import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { CoastState, SEED_STATE, Transaction, Income, BudgetPlan } from '@coast/core';
import { closeLeak } from '@coast/engine';

export interface CoastStore {
  data: CoastState;
  hydrate(next: CoastState): void;
  addTransaction(t: Transaction): void;
  completeOnboarding(income: Income, plan: BudgetPlan): void;
  stampStatement(id: string): void;
  closeLeakById(id: string): void;
  reset(): void;
}

const freshSeed = (): CoastState => JSON.parse(JSON.stringify(SEED_STATE));

export const coastStore = createStore<CoastStore>()((set, get) => ({
  data: freshSeed(),
  hydrate: (next) => set({ data: next }),
  addTransaction: (t) =>
    set({ data: { ...get().data, transactions: [t, ...get().data.transactions] } }),
  completeOnboarding: (income, plan) =>
    set({ data: { ...get().data, income, plan, onboardingComplete: true } }),
  stampStatement: (id) =>
    set({
      data: {
        ...get().data,
        statements: get().data.statements.map((s) =>
          s.id === id ? { ...s, status: 'stamped' } : s,
        ),
      },
    }),
  closeLeakById: (id) =>
    set({ data: { ...get().data, leaks: closeLeak(get().data.leaks, id) } }),
  reset: () => set({ data: freshSeed() }),
}));

export function useCoastStore<T>(selector: (s: CoastStore) => T): T {
  return useStore(coastStore, selector);
}
