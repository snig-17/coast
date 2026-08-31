import { Pence, parseAmount, Income, BudgetPlan } from '@coast/core';

// ---------------------------------------------------------------------------
// Pay frequency
// ---------------------------------------------------------------------------
export type Frequency = 'monthly' | 'four_weekly' | 'fortnightly' | 'weekly' | 'twice_monthly' | 'variable';

export const FREQUENCIES: { key: Frequency; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'four_weekly', label: 'Every 4 weeks' },
  { key: 'fortnightly', label: 'Every 2 weeks' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'twice_monthly', label: 'Twice monthly' },
  { key: 'variable', label: 'Income varies' },
];

export function freqLabel(f: Frequency): string {
  return FREQUENCIES.find((x) => x.key === f)?.label ?? 'Monthly';
}

/** Normalise an amount entered at a given frequency to a monthly figure (pence). */
export function toMonthly(pence: Pence, freq: Frequency): Pence {
  switch (freq) {
    case 'weekly': return Math.round((pence * 52) / 12);
    case 'fortnightly': return Math.round((pence * 26) / 12);
    case 'four_weekly': return Math.round((pence * 13) / 12);
    case 'twice_monthly': return pence * 2;
    default: return pence; // monthly, variable
  }
}

export type Cadence2 = 'week' | 'month';
export function cadenceToMonthly(pence: Pence, c: Cadence2): Pence {
  return c === 'week' ? Math.round((pence * 52) / 12) : pence;
}

// ---------------------------------------------------------------------------
// Payday rule -> day-of-month proxy for the (monthly) engine
// ---------------------------------------------------------------------------
export type PaydayRule =
  | { kind: 'day'; dom: number }
  | { kind: 'lastDay' }
  | { kind: 'lastWorkingDay' }
  | { kind: 'lastFriday' }
  | { kind: 'firstWorkingDay' };

export function ruleLabel(r: PaydayRule): string {
  switch (r.kind) {
    case 'day': return r.dom === 31 ? 'last day' : `day ${r.dom}`;
    case 'lastDay': return 'last day';
    case 'lastWorkingDay': return 'last working day';
    case 'lastFriday': return 'last Friday';
    case 'firstWorkingDay': return 'first working day';
  }
}

/** Map a payday rule to a day-of-month the monthly pay-cycle engine understands.
 *  lastDay -> 31 (engine clamps to each month's real length). lastWorkingDay ~= 31,
 *  lastFriday ~= 28, firstWorkingDay -> 1. These are documented approximations. */
export function ruleToDom(r: PaydayRule): number {
  switch (r.kind) {
    case 'day': return r.dom;
    case 'lastDay': return 31;
    case 'lastWorkingDay': return 31;
    case 'lastFriday': return 28;
    case 'firstWorkingDay': return 1;
  }
}

// ---------------------------------------------------------------------------
// Category / preset catalogues
// ---------------------------------------------------------------------------
export interface CatDef { key: string; name: string; hint: string }

export const ESSENTIAL_CATS: CatDef[] = [
  { key: 'groceries', name: 'Groceries', hint: 'Food shops and top-ups' },
  { key: 'transport', name: 'Transport', hint: 'Fuel, fares and regular travel' },
  { key: 'health', name: 'Health', hint: 'Medication, therapy and appointments' },
];

export const LIFESTYLE_CATS: CatDef[] = [
  { key: 'takeaways', name: 'Takeaways', hint: 'Delivery and food on the go' },
  { key: 'coffee', name: 'Coffee & lunch', hint: 'Cafés, meal deals and work lunches' },
  { key: 'going_out', name: 'Going out', hint: 'Drinks, restaurants, dates and events' },
  { key: 'shopping', name: 'Shopping', hint: 'Clothes, Amazon and home bits' },
  { key: 'convenience', name: 'Convenience travel', hint: 'Taxis, Ubers and convenience trips' },
  { key: 'impulse', name: 'Impulse buys', hint: 'Snacks, quick buys and unplanned extras' },
];

export const SUB_PRESETS: { name: string; pence: Pence }[] = [
  { name: 'Netflix', pence: 1299 },
  { name: 'Spotify', pence: 1199 },
  { name: 'Prime', pence: 899 },
  { name: 'Disney+', pence: 899 },
  { name: 'Apple/iCloud', pence: 299 },
  { name: 'ChatGPT', pence: 2000 },
];

export interface GoalDef { key: string; name: string; hint: string; icon: string; rec?: boolean }
export const GOALS: GoalDef[] = [
  { key: 'emergency', name: 'Emergency fund', hint: '3 months of fixed costs', icon: '🛟', rec: true },
  { key: 'home', name: 'A home', hint: 'A deposit, move or place of your own', icon: '🏠' },
  { key: 'holiday', name: 'A holiday', hint: 'A trip you can enjoy without the comedown', icon: '✈️' },
  { key: 'car', name: 'A car', hint: 'Buy, replace or upgrade without scrambling', icon: '🚗' },
  { key: 'purchase', name: 'A big purchase', hint: 'Something meaningful that deserves a plan', icon: '🎯' },
];

export type Pace = 'comfortable' | 'balanced' | 'ambitious';
export const PACE_FRACTION: Record<Pace, number> = { comfortable: 0.5, balanced: 0.75, ambitious: 0.9 };
export const PACE_META: { key: Pace; name: string; hint: string; rec?: boolean }[] = [
  { key: 'comfortable', name: 'Comfortable', hint: 'Keep more room month to month' },
  { key: 'balanced', name: 'Balanced', hint: 'Make progress without feeling tight', rec: true },
  { key: 'ambitious', name: 'Ambitious', hint: 'Move faster with a smaller cushion' },
];

// ---------------------------------------------------------------------------
// Flow state
// ---------------------------------------------------------------------------
export interface IncomeSource { amount: string; freq: Frequency }
export interface CategoryEntry { amount: string; cadence: Cadence2; skipped: boolean }
export interface Sub { name: string; pence: Pence }

export interface Flow {
  incomes: IncomeSource[];
  payFreq: Frequency;
  payday: PaydayRule;
  home: { kind: 'rent' | 'mortgage' | 'none'; amount: string };
  bills: { mode: 'quick' | 'breakdown'; amount: string; skipped: boolean };
  debt: { has: boolean; amount: string };
  essentials: Record<string, CategoryEntry>;
  lifestyle: Record<string, CategoryEntry>;
  subs: Sub[];
  goals: string[];
  pace: Pace;
}

const emptyEntry = (): CategoryEntry => ({ amount: '', cadence: 'month', skipped: false });
const initCats = (defs: CatDef[]): Record<string, CategoryEntry> =>
  defs.reduce((acc, d) => ({ ...acc, [d.key]: emptyEntry() }), {} as Record<string, CategoryEntry>);

export function initialFlow(): Flow {
  return {
    incomes: [{ amount: '', freq: 'monthly' }],
    payFreq: 'monthly',
    payday: { kind: 'day', dom: 25 },
    home: { kind: 'rent', amount: '' },
    bills: { mode: 'quick', amount: '', skipped: false },
    debt: { has: false, amount: '' },
    essentials: initCats(ESSENTIAL_CATS),
    lifestyle: initCats(LIFESTYLE_CATS),
    subs: [],
    goals: [],
    pace: 'balanced',
  };
}

// ---------------------------------------------------------------------------
// Derived money
// ---------------------------------------------------------------------------
function sumCats(rec: Record<string, CategoryEntry>): Pence {
  return Object.values(rec).reduce(
    (s, e) => (e.skipped ? s : s + cadenceToMonthly(parseAmount(e.amount), e.cadence)),
    0,
  );
}

export const incomeMonthly = (f: Flow): Pence =>
  f.incomes.reduce((s, i) => s + toMonthly(parseAmount(i.amount), i.freq), 0);
export const homeMonthly = (f: Flow): Pence => (f.home.kind === 'none' ? 0 : parseAmount(f.home.amount));
export const billsMonthly = (f: Flow): Pence => (f.bills.skipped ? 0 : parseAmount(f.bills.amount));
export const debtMonthly = (f: Flow): Pence => (f.debt.has ? parseAmount(f.debt.amount) : 0);
export const essentialsMonthly = (f: Flow): Pence => sumCats(f.essentials);
export const lifestyleMonthly = (f: Flow): Pence => sumCats(f.lifestyle);
export const subsMonthly = (f: Flow): Pence => f.subs.reduce((s, x) => s + x.pence, 0);
export const fixedMonthly = (f: Flow): Pence => homeMonthly(f) + billsMonthly(f) + debtMonthly(f);

/** Money still free after fixed costs, debt and the flexible life you mapped. */
export const availableForSavings = (f: Flow): Pence =>
  Math.max(0, incomeMonthly(f) - fixedMonthly(f) - essentialsMonthly(f) - lifestyleMonthly(f) - subsMonthly(f));

/** Money left to allocate at the start of the flexible-mapping phase. */
export const leftToMap = (f: Flow): Pence =>
  Math.max(0, incomeMonthly(f) - fixedMonthly(f));

export const paceAmount = (f: Flow, pace: Pace): Pence =>
  Math.round(availableForSavings(f) * PACE_FRACTION[pace]);

export function buildPlanFromFlow(f: Flow): { income: Income; plan: BudgetPlan } {
  const bills = homeMonthly(f) + billsMonthly(f);
  const debt = debtMonthly(f);
  const savings = paceAmount(f, f.pace);
  const essentials = essentialsMonthly(f);
  const lifestyle = lifestyleMonthly(f);
  const joy = subsMonthly(f);
  const discretionary = essentials + lifestyle + joy;
  const income: Income = { monthly: incomeMonthly(f), paydayDom: ruleToDom(f.payday) };
  const plan: BudgetPlan = { bills, savings, debt, discretionary, essentials, lifestyle, joy };
  return { income, plan };
}
