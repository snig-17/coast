import { annualLeakTotal, leaksClosedAnnual, closeLeak, detectLeaks } from '../leaks';
import { SEED_STATE, categoriesById, Transaction } from '@coast/core';

describe('leak totals', () => {
  it('sums open leaks to the reference £2,860/yr', () => {
    expect(annualLeakTotal(SEED_STATE.leaks)).toBe(286000);
    expect(leaksClosedAnnual(SEED_STATE.leaks)).toBe(0);
  });
  it('closing a leak moves it from open to closed totals', () => {
    const next = closeLeak(SEED_STATE.leaks, 'leak_fees');
    expect(annualLeakTotal(next)).toBe(286000 - 70000);
    expect(leaksClosedAnnual(next)).toBe(70000);
  });
});

describe('detectLeaks', () => {
  it('flags a repeated discretionary merchant as an annualised leak', () => {
    const cats = categoriesById();
    const txns: Transaction[] = [
      { id: 'a', amount: 999, categoryId: 'subscriptions', date: '2026-06-10', merchant: 'ByteFlix', source: 'import' },
      { id: 'b', amount: 999, categoryId: 'subscriptions', date: '2026-07-10', merchant: 'ByteFlix', source: 'import' },
      { id: 'c', amount: 999, categoryId: 'subscriptions', date: '2026-08-10', merchant: 'ByteFlix', source: 'import' },
      { id: 'd', amount: 500, categoryId: 'groceries',     date: '2026-08-10', merchant: 'Tesco',    source: 'import' },
    ];
    const leaks = detectLeaks(txns, cats);
    const byteflix = leaks.find((l) => l.merchant === 'ByteFlix');
    expect(byteflix).toBeDefined();
    expect(byteflix!.annual).toBe(999 * 12);
    expect(leaks.find((l) => l.merchant === 'Tesco')).toBeUndefined(); // essentials, not a leak
  });
});
