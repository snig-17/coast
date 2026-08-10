import { Leak, Transaction, Category, Pence } from '@coast/core';

export function annualLeakTotal(leaks: Leak[]): Pence {
  return leaks.filter((l) => !l.closed).reduce((sum, l) => sum + l.annual, 0);
}

export function leaksClosedAnnual(leaks: Leak[]): Pence {
  return leaks.filter((l) => l.closed).reduce((sum, l) => sum + l.annual, 0);
}

export function closeLeak(leaks: Leak[], id: string): Leak[] {
  return leaks.map((l) => (l.id === id ? { ...l, closed: true } : l));
}

export interface DetectedLeak {
  merchant: string;
  annual: Pence;
}

// A leak is a discretionary merchant (never a protected 'joy'... treated as recurring)
// that recurs at least 3 times. Annualised as the typical charge x 12.
export function detectLeaks(
  transactions: Transaction[],
  categoriesById: Record<string, Category>,
): DetectedLeak[] {
  const byMerchant = new Map<string, Pence[]>();
  for (const t of transactions) {
    const cat = categoriesById[t.categoryId];
    if (!cat || cat.group !== 'discretionary' || cat.subpool === 'essentials') continue;
    if (!t.merchant) continue;
    const list = byMerchant.get(t.merchant) ?? [];
    list.push(t.amount);
    byMerchant.set(t.merchant, list);
  }
  const leaks: DetectedLeak[] = [];
  for (const [merchant, amounts] of byMerchant) {
    if (amounts.length < 3) continue;
    const typical = amounts.slice().sort((a, b) => a - b)[Math.floor(amounts.length / 2)]; // median
    leaks.push({ merchant, annual: typical * 12 });
  }
  return leaks;
}
