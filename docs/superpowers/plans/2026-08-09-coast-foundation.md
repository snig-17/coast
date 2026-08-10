# Coast Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Coast monorepo skeleton plus the two pure, fully-tested TypeScript packages — `@coast/core` (models, category catalog, seed data, CSV parsing, persistence) and `@coast/engine` (pay cycle, spend room, cycle summary, plan breakdown, leaks, weekly statement) — so every later UI plan consumes a stable, verified data layer.

**Architecture:** A pnpm/npm-workspaces monorepo. `@coast/core` holds platform-agnostic domain types and data with zero runtime dependencies. `@coast/engine` holds pure calculation functions that import types from `@coast/core`. Both are tested with Jest via `ts-jest`. No React Native, no I/O, no `Date.now()` inside functions — callers pass a reference date, which keeps everything deterministic and testable.

**Tech Stack:** TypeScript 5.x, Jest 29 + ts-jest, npm workspaces. Currency is stored as integer pence (`Pence = number`) to avoid floating-point drift.

## Global Constraints

- **Money is integer pence.** Never store or compute money as pounds-with-decimals. Type alias `Pence = number`.
- **Determinism.** No function may call `Date.now()`, `new Date()` with no args, or `Math.random()`. Reference dates and ids are passed in by the caller.
- **Dates are UTC.** All date math uses `Date.UTC(...)` / `getUTC*`. Transaction dates are ISO `yyyy-mm-dd` strings.
- **`@coast/core` has no runtime dependencies** and never imports from `@coast/engine`. `@coast/engine` may import types/values from `@coast/core` only.
- **Node ≥ 18**, TypeScript `strict: true`.
- **Reference seed numbers (must hold exactly):** monthly income `206500`; payday day-of-month `31`; plan `{bills:152000, savings:8500, debt:0, discretionary:46000}` summing to `206500`; discretionary subpools `{essentials:20000, lifestyle:17886, joy:8114}` summing to `46000`; recurring payments sum `152000`; leaks annual total `286000`; with reference date `2026-08-09` the current pay cycle is `2026-07-31 → 2026-08-31` (display end `2026-08-30`), `daysUntilPayday = 22`, `dailyRoom = 813` (£8.13), `leftUntilPayday = 17886` (£178.86), statement `nextDailyLine = 900` (£9).

---

## Plan roadmap (context; only Plan 1 is detailed here)

1. **Foundation** — monorepo + `@coast/core` + `@coast/engine` (this document).
2. **App shell** — Expo app, design system tokens/primitives, Zustand store bound to the engine, `expo-file-system` persistence, tab navigation.
3. **Core tabs** — Home, Activity, Payments, Plan, Profile, Statements (screens over the store).
4. **Onboarding + recording** — onboarding wizard, quick-add sheet, CSV import UI over `@coast/core` parsing.
5. **Product polish** — landing page, refined onboarding copy, `expo-notifications` reminders, home-screen widget (dev build).

---

## File structure (Plan 1)

```
coast/
  package.json                      # workspaces root + scripts
  tsconfig.base.json                # shared strict TS config
  jest.config.js                    # ts-jest, projects, moduleNameMapper
  packages/
    core/
      package.json                  # @coast/core
      tsconfig.json
      src/
        index.ts                    # barrel
        money.ts                    # Pence, parseAmount, formatGBP
        types.ts                    # all domain interfaces + unions
        categories.ts               # CATEGORIES catalog + helpers
        seed.ts                     # SEED_STATE (demo data)
        csv.ts                      # parseCsv (Amex/Revolut) -> transactions
        categorize.ts               # merchant -> categoryId heuristics
        persistence.ts              # CoastState serialize/deserialize/migrate
        __tests__/
          money.test.ts
          categories.test.ts
          seed.test.ts
          csv.test.ts
          persistence.test.ts
    engine/
      package.json                  # @coast/engine (deps: @coast/core)
      tsconfig.json
      src/
        index.ts                    # barrel
        payCycle.ts
        planBreakdown.ts
        cycleSummary.ts
        spendRoom.ts
        leaks.ts
        weeklyStatement.ts
        __tests__/
          payCycle.test.ts
          planBreakdown.test.ts
          cycleSummary.test.ts
          spendRoom.test.ts
          leaks.test.ts
          weeklyStatement.test.ts
```

---

## Task 1: Monorepo scaffold + money module

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `jest.config.js`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/index.ts`, `packages/core/src/money.ts`
- Test: `packages/core/src/__tests__/money.test.ts`

**Interfaces:**
- Produces: `type Pence = number`; `parseAmount(input: string): Pence`; `type MoneyMode = 'auto'|'exact'|'whole'`; `formatGBP(pence: Pence, mode?: MoneyMode): string`.

- [ ] **Step 1: Create the workspace root files**

`package.json`:
```json
{
  "name": "coast",
  "private": true,
  "version": "0.0.0",
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "test": "jest",
    "typecheck": "tsc -b packages/core packages/engine --noEmit"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "typescript": "^5.4.5"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "composite": true
  }
}
```

`jest.config.js`:
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  moduleNameMapper: {
    '^@coast/core$': '<rootDir>/packages/core/src',
    '^@coast/engine$': '<rootDir>/packages/engine/src',
  },
};
```

- [ ] **Step 2: Create the core package files**

`packages/core/package.json`:
```json
{
  "name": "@coast/core",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

`packages/core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

`packages/core/src/index.ts`:
```ts
export * from './money';
```

- [ ] **Step 3: Write the failing test**

`packages/core/src/__tests__/money.test.ts`:
```ts
import { parseAmount, formatGBP } from '../money';

describe('parseAmount', () => {
  it('parses plain and symbol-prefixed amounts to pence', () => {
    expect(parseAmount('8.13')).toBe(813);
    expect(parseAmount('£1,520.00')).toBe(152000);
    expect(parseAmount('-12.50')).toBe(-1250);
  });
  it('treats blanks and junk as zero', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('-')).toBe(0);
    expect(parseAmount('n/a')).toBe(0);
  });
});

describe('formatGBP', () => {
  it('auto: hides decimals for whole pounds, shows them otherwise', () => {
    expect(formatGBP(152000)).toBe('£1,520');
    expect(formatGBP(206500)).toBe('£2,065');
    expect(formatGBP(813)).toBe('£8.13');
    expect(formatGBP(17886)).toBe('£178.86');
    expect(formatGBP(0)).toBe('£0');
  });
  it('exact: always two decimals', () => {
    expect(formatGBP(0, 'exact')).toBe('£0.00');
    expect(formatGBP(152000, 'exact')).toBe('£1,520.00');
  });
  it('whole: rounds to the nearest pound', () => {
    expect(formatGBP(813, 'whole')).toBe('£8');
    expect(formatGBP(17886, 'whole')).toBe('£179');
  });
  it('keeps a leading minus for negatives', () => {
    expect(formatGBP(-1250)).toBe('-£12.50');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm install && npx jest money`
Expected: FAIL — `Cannot find module '../money'`.

- [ ] **Step 5: Implement the money module**

`packages/core/src/money.ts`:
```ts
export type Pence = number;

export function parseAmount(input: string): Pence {
  const cleaned = input.replace(/[^0-9.\-]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;
  const value = Math.round(parseFloat(cleaned) * 100);
  return Number.isFinite(value) ? value : 0;
}

export type MoneyMode = 'auto' | 'exact' | 'whole';

export function formatGBP(pence: Pence, mode: MoneyMode = 'auto'): string {
  const negative = pence < 0;
  const abs = Math.abs(pence);
  let body: string;
  if (mode === 'whole') {
    body = Math.round(abs / 100).toLocaleString('en-GB');
  } else if (mode === 'exact' || abs % 100 !== 0) {
    body = (abs / 100).toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    body = Math.trunc(abs / 100).toLocaleString('en-GB');
  }
  return `${negative ? '-' : ''}£${body}`;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest money`
Expected: PASS (all cases).

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.base.json jest.config.js packages/core
git commit -m "feat(core): monorepo scaffold + money module"
```

---

## Task 2: Domain types + category catalog

**Files:**
- Create: `packages/core/src/types.ts`, `packages/core/src/categories.ts`
- Modify: `packages/core/src/index.ts` (export new modules)
- Test: `packages/core/src/__tests__/categories.test.ts`

**Interfaces:**
- Produces (`types.ts`): `Cadence`, `CategoryGroup`, `DiscretionarySubpool`, `EntrySource`, `Category`, `Transaction`, `Payment`, `Income`, `BudgetPlan`, `Fund`, `Leak`, `StatementStatus`, `Statement`, `CoastState`.
- Produces (`categories.ts`): `CATEGORIES: Category[]`; `categoriesById(cats?: Category[]): Record<string, Category>`; `categoryGroup(id: string, cats?: Category[]): CategoryGroup | undefined`.

- [ ] **Step 1: Write the types module**

`packages/core/src/types.ts`:
```ts
import { Pence } from './money';

export type Cadence = 'weekly' | 'monthly';
export type CategoryGroup = 'bills' | 'savings' | 'debt' | 'discretionary';
export type DiscretionarySubpool = 'essentials' | 'lifestyle' | 'joy';
export type EntrySource = 'manual' | 'import';

export interface Category {
  id: string;
  name: string;
  group: CategoryGroup;
  subpool?: DiscretionarySubpool; // present only when group === 'discretionary'
  color: string;                  // hex
  icon: string;                   // ionicons name
}

export interface Transaction {
  id: string;
  amount: Pence;      // positive = money spent
  categoryId: string;
  date: string;       // ISO yyyy-mm-dd
  note?: string;
  merchant?: string;
  source: EntrySource;
}

export interface Payment {
  id: string;
  name: string;
  amount: Pence;
  cadence: Cadence;
  billingDay: number; // day of month
  categoryId: string;
}

export interface Income {
  monthly: Pence;
  paydayDom: number;  // day of month
}

export interface BudgetPlan {
  bills: Pence;
  savings: Pence;
  debt: Pence;
  discretionary: Pence;
  essentials: Pence;  // discretionary subpool
  lifestyle: Pence;   // discretionary subpool (drives daily spend room)
  joy: Pence;         // discretionary subpool (protected)
}

export interface Fund {
  id: string;
  name: string;
  goal: Pence;
  saved: Pence;
}

export interface Leak {
  id: string;
  merchant: string;
  annual: Pence;
  closed: boolean;
}

export type StatementStatus = 'readyToStamp' | 'stamped';

export interface Statement {
  id: string;
  issueNumber: number; // ISO week number
  weekStart: string;   // ISO yyyy-mm-dd (Monday)
  issuedDate: string;  // ISO yyyy-mm-dd
  status: StatementStatus;
}

export interface CoastState {
  schemaVersion: number;
  onboardingComplete: boolean;
  profileName: string;
  memberSince: string; // ISO yyyy-mm-dd
  income: Income;
  plan: BudgetPlan;
  categories: Category[];
  transactions: Transaction[];
  payments: Payment[];
  funds: Fund[];
  leaks: Leak[];
  statements: Statement[];
}
```

- [ ] **Step 2: Write the failing test**

`packages/core/src/__tests__/categories.test.ts`:
```ts
import { CATEGORIES, categoriesById, categoryGroup } from '../categories';

describe('CATEGORIES catalog', () => {
  it('has unique ids', () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('gives every category a colour and icon', () => {
    for (const c of CATEGORIES) {
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.icon.length).toBeGreaterThan(0);
    }
  });
  it('only discretionary categories carry a subpool', () => {
    for (const c of CATEGORIES) {
      if (c.group === 'discretionary') expect(c.subpool).toBeDefined();
      else expect(c.subpool).toBeUndefined();
    }
  });
  it('resolves group by id', () => {
    expect(categoryGroup('rent')).toBe('bills');
    expect(categoryGroup('eating_out')).toBe('discretionary');
    expect(categoryGroup('nope')).toBeUndefined();
  });
  it('indexes by id', () => {
    expect(categoriesById()['savings'].group).toBe('savings');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest categories`
Expected: FAIL — `Cannot find module '../categories'`.

- [ ] **Step 4: Implement the catalog**

`packages/core/src/categories.ts`:
```ts
import { Category, CategoryGroup } from './types';

export const CATEGORIES: Category[] = [
  // Bills & Fixed
  { id: 'rent',          name: 'Rent',          group: 'bills', color: '#1A1A1A', icon: 'home' },
  { id: 'utilities',     name: 'Utilities',     group: 'bills', color: '#1A1A1A', icon: 'flash' },
  { id: 'phone',         name: 'Phone',         group: 'bills', color: '#1A1A1A', icon: 'call' },
  { id: 'insurance',     name: 'Insurance',     group: 'bills', color: '#1A1A1A', icon: 'shield' },
  // Savings
  { id: 'savings',       name: 'Savings',       group: 'savings', color: '#2E7D5B', icon: 'wallet' },
  // Debt
  { id: 'debt',          name: 'Debt',          group: 'debt', color: '#D98A3D', icon: 'card' },
  // Discretionary — essentials
  { id: 'groceries',     name: 'Groceries',     group: 'discretionary', subpool: 'essentials', color: '#7A7A70', icon: 'cart' },
  { id: 'transport',     name: 'Transport',     group: 'discretionary', subpool: 'essentials', color: '#7A7A70', icon: 'bus' },
  { id: 'health',        name: 'Health',        group: 'discretionary', subpool: 'essentials', color: '#7A7A70', icon: 'medkit' },
  // Discretionary — lifestyle (drives spend room)
  { id: 'eating_out',    name: 'Eating out',    group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'restaurant' },
  { id: 'shopping',      name: 'Shopping',      group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'bag' },
  { id: 'fun',           name: 'Fun',           group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'sparkles' },
  { id: 'uncategorised', name: 'Uncategorised', group: 'discretionary', subpool: 'lifestyle', color: '#0F6E6E', icon: 'ellipsis-horizontal' },
  // Discretionary — joy (protected)
  { id: 'subscriptions', name: 'Subscriptions', group: 'discretionary', subpool: 'joy', color: '#E4694E', icon: 'tv' },
  { id: 'treats',        name: 'Treats',        group: 'discretionary', subpool: 'joy', color: '#E4694E', icon: 'gift' },
];

export function categoriesById(cats: Category[] = CATEGORIES): Record<string, Category> {
  return Object.fromEntries(cats.map((c) => [c.id, c]));
}

export function categoryGroup(id: string, cats: Category[] = CATEGORIES): CategoryGroup | undefined {
  return cats.find((c) => c.id === id)?.group;
}
```

- [ ] **Step 5: Update the barrel**

`packages/core/src/index.ts`:
```ts
export * from './money';
export * from './types';
export * from './categories';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest categories`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): domain types + category catalog"
```

---

## Task 3: Seed data

**Files:**
- Create: `packages/core/src/seed.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/__tests__/seed.test.ts`

**Interfaces:**
- Consumes: `CATEGORIES`, all types from Task 2.
- Produces: `SEED_STATE: CoastState`.

- [ ] **Step 1: Write the failing test**

`packages/core/src/__tests__/seed.test.ts`:
```ts
import { SEED_STATE } from '../seed';

describe('SEED_STATE', () => {
  it('plan groups sum to monthly income', () => {
    const p = SEED_STATE.plan;
    expect(p.bills + p.savings + p.debt + p.discretionary).toBe(SEED_STATE.income.monthly);
    expect(SEED_STATE.income.monthly).toBe(206500);
  });
  it('discretionary subpools sum to discretionary', () => {
    const p = SEED_STATE.plan;
    expect(p.essentials + p.lifestyle + p.joy).toBe(p.discretionary);
    expect(p.lifestyle).toBe(17886);
  });
  it('recurring payments sum to bills', () => {
    const total = SEED_STATE.payments.reduce((s, p) => s + p.amount, 0);
    expect(total).toBe(152000);
  });
  it('open leaks annualise to £2,860', () => {
    const total = SEED_STATE.leaks.reduce((s, l) => s + l.annual, 0);
    expect(total).toBe(286000);
  });
  it('starts pre-onboarding with one ready statement and no transactions', () => {
    expect(SEED_STATE.onboardingComplete).toBe(false);
    expect(SEED_STATE.transactions).toHaveLength(0);
    expect(SEED_STATE.statements[0].status).toBe('readyToStamp');
    expect(SEED_STATE.income.paydayDom).toBe(31);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest seed`
Expected: FAIL — `Cannot find module '../seed'`.

- [ ] **Step 3: Implement the seed**

`packages/core/src/seed.ts`:
```ts
import { CoastState } from './types';
import { CATEGORIES } from './categories';

export const SEED_STATE: CoastState = {
  schemaVersion: 1,
  onboardingComplete: false,
  profileName: 'Snigdha',
  memberSince: '2026-08-01',
  income: { monthly: 206500, paydayDom: 31 },
  plan: {
    bills: 152000,
    savings: 8500,
    debt: 0,
    discretionary: 46000,
    essentials: 20000,
    lifestyle: 17886,
    joy: 8114,
  },
  categories: CATEGORIES,
  transactions: [],
  payments: [
    { id: 'pmt_rent',      name: 'Rent',      amount: 110000, cadence: 'monthly', billingDay: 1,  categoryId: 'rent' },
    { id: 'pmt_utilities', name: 'Utilities', amount: 22000,  cadence: 'monthly', billingDay: 15, categoryId: 'utilities' },
    { id: 'pmt_insurance', name: 'Insurance', amount: 16000,  cadence: 'monthly', billingDay: 5,  categoryId: 'insurance' },
    { id: 'pmt_phone',     name: 'Phone',     amount: 4000,   cadence: 'monthly', billingDay: 20, categoryId: 'phone' },
  ],
  funds: [],
  leaks: [
    { id: 'leak_streaming', merchant: 'Streaming bundle',     annual: 120000, closed: false },
    { id: 'leak_subs',      merchant: 'Unused subscriptions', annual: 96000,  closed: false },
    { id: 'leak_fees',      merchant: 'Card fees',            annual: 70000,  closed: false },
  ],
  statements: [
    { id: 'stmt_w31', issueNumber: 31, weekStart: '2026-07-27', issuedDate: '2026-08-09', status: 'readyToStamp' },
  ],
};
```

- [ ] **Step 4: Update the barrel**

Append to `packages/core/src/index.ts`:
```ts
export * from './seed';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest seed`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): seed demo state matching reference screens"
```

---

## Task 4: Pay-cycle engine

**Files:**
- Create: `packages/engine/package.json`, `packages/engine/tsconfig.json`, `packages/engine/src/index.ts`, `packages/engine/src/payCycle.ts`
- Test: `packages/engine/src/__tests__/payCycle.test.ts`

**Interfaces:**
- Produces: `interface PayCycle { start: Date; nextPayday: Date; displayEnd: Date; daysUntilPayday: number; cycleLengthDays: number }`; `payCycle(paydayDom: number, ref: Date): PayCycle`.

- [ ] **Step 1: Create the engine package**

`packages/engine/package.json`:
```json
{
  "name": "@coast/engine",
  "version": "0.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": { "@coast/core": "0.0.0" }
}
```

`packages/engine/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "references": [{ "path": "../core" }],
  "include": ["src"]
}
```

`packages/engine/src/index.ts`:
```ts
export * from './payCycle';
```

- [ ] **Step 2: Write the failing test**

`packages/engine/src/__tests__/payCycle.test.ts`:
```ts
import { payCycle } from '../payCycle';

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('payCycle', () => {
  it('computes the current cycle from the reference screenshots', () => {
    const c = payCycle(31, new Date('2026-08-09T12:00:00Z'));
    expect(iso(c.start)).toBe('2026-07-31');
    expect(iso(c.nextPayday)).toBe('2026-08-31');
    expect(iso(c.displayEnd)).toBe('2026-08-30');
    expect(c.daysUntilPayday).toBe(22);
    expect(c.cycleLengthDays).toBe(31);
  });
  it('when ref is exactly payday, the cycle starts today', () => {
    const c = payCycle(31, new Date('2026-08-31T00:00:00Z'));
    expect(iso(c.start)).toBe('2026-08-31');
    expect(iso(c.nextPayday)).toBe('2026-09-30'); // Sept has 30 days -> clamped
  });
  it('clamps payday to the last day of shorter months', () => {
    const c = payCycle(31, new Date('2026-02-10T00:00:00Z'));
    expect(iso(c.start)).toBe('2026-01-31');
    expect(iso(c.nextPayday)).toBe('2026-02-28');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest payCycle`
Expected: FAIL — `Cannot find module '../payCycle'`.

- [ ] **Step 4: Implement the pay cycle**

`packages/engine/src/payCycle.ts`:
```ts
const MS_PER_DAY = 86_400_000;

function lastDomOf(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function paydayForMonthOffset(ref: Date, dom: number, offset: number): Date {
  const totalMonths = ref.getUTCMonth() + offset;
  const year = ref.getUTCFullYear() + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const day = Math.min(dom, lastDomOf(year, month));
  return new Date(Date.UTC(year, month, day));
}

export interface PayCycle {
  start: Date;
  nextPayday: Date;
  displayEnd: Date;
  daysUntilPayday: number;
  cycleLengthDays: number;
}

export function payCycle(paydayDom: number, ref: Date): PayCycle {
  const refDay = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const thisPayday = paydayForMonthOffset(ref, paydayDom, 0);

  let start: Date;
  let nextPayday: Date;
  if (refDay.getTime() >= thisPayday.getTime()) {
    start = thisPayday;
    nextPayday = paydayForMonthOffset(ref, paydayDom, 1);
  } else {
    start = paydayForMonthOffset(ref, paydayDom, -1);
    nextPayday = thisPayday;
  }

  const daysUntilPayday = Math.round((nextPayday.getTime() - refDay.getTime()) / MS_PER_DAY);
  const cycleLengthDays = Math.round((nextPayday.getTime() - start.getTime()) / MS_PER_DAY);
  const displayEnd = new Date(nextPayday.getTime() - MS_PER_DAY);

  return { start, nextPayday, displayEnd, daysUntilPayday, cycleLengthDays };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest payCycle`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine
git commit -m "feat(engine): deterministic pay-cycle calculation"
```

---

## Task 5: Plan breakdown (donut)

**Files:**
- Create: `packages/engine/src/planBreakdown.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/__tests__/planBreakdown.test.ts`

**Interfaces:**
- Consumes: `BudgetPlan` from `@coast/core`.
- Produces: `interface PlanSegment { group: 'bills'|'savings'|'debt'|'discretionary'; amount: Pence; pct: number }`; `interface PlanBreakdown { segments: PlanSegment[]; total: Pence }`; `planBreakdown(plan: BudgetPlan): PlanBreakdown`.

- [ ] **Step 1: Write the failing test**

`packages/engine/src/__tests__/planBreakdown.test.ts`:
```ts
import { planBreakdown } from '../planBreakdown';
import { SEED_STATE } from '@coast/core';

describe('planBreakdown', () => {
  it('totals the four groups and shares each as a fraction', () => {
    const b = planBreakdown(SEED_STATE.plan);
    expect(b.total).toBe(206500);
    const bills = b.segments.find((s) => s.group === 'bills')!;
    expect(bills.amount).toBe(152000);
    expect(bills.pct).toBeCloseTo(152000 / 206500, 6);
    expect(b.segments.map((s) => s.group)).toEqual(['bills', 'savings', 'debt', 'discretionary']);
  });
  it('is safe when the plan is empty', () => {
    const b = planBreakdown({ bills: 0, savings: 0, debt: 0, discretionary: 0, essentials: 0, lifestyle: 0, joy: 0 });
    expect(b.total).toBe(0);
    expect(b.segments.every((s) => s.pct === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest planBreakdown`
Expected: FAIL — `Cannot find module '../planBreakdown'`.

- [ ] **Step 3: Implement the breakdown**

`packages/engine/src/planBreakdown.ts`:
```ts
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
```

- [ ] **Step 4: Update the barrel**

Append to `packages/engine/src/index.ts`:
```ts
export * from './planBreakdown';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest planBreakdown`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src
git commit -m "feat(engine): plan breakdown for the budget donut"
```

---

## Task 6: Cycle summary (Activity)

**Files:**
- Create: `packages/engine/src/cycleSummary.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/__tests__/cycleSummary.test.ts`

**Interfaces:**
- Consumes: `Transaction`, `Category`, `BudgetPlan`, `Income` from `@coast/core`; `PayCycle` from `./payCycle`.
- Produces: `interface GroupSpend { group: CategoryGroup; spent: Pence; allocated: Pence; pctOfIncome: number }`; `interface CycleSummary { totalSpent: Pence; pctOfIncome: number; groups: GroupSpend[] }`; `cycleSummary(transactions, categoriesById, plan, income, cycle): CycleSummary`.

- [ ] **Step 1: Write the failing test**

`packages/engine/src/__tests__/cycleSummary.test.ts`:
```ts
import { cycleSummary } from '../cycleSummary';
import { payCycle } from '../payCycle';
import { SEED_STATE, categoriesById, Transaction } from '@coast/core';

const cats = categoriesById();
const cycle = payCycle(31, new Date('2026-08-09T12:00:00Z'));

describe('cycleSummary', () => {
  it('is all zeroes for an empty cycle', () => {
    const s = cycleSummary([], cats, SEED_STATE.plan, SEED_STATE.income, cycle);
    expect(s.totalSpent).toBe(0);
    expect(s.pctOfIncome).toBe(0);
    expect(s.groups.map((g) => g.group)).toEqual(['discretionary', 'bills', 'savings']);
    expect(s.groups.every((g) => g.spent === 0 && g.pctOfIncome === 0)).toBe(true);
  });
  it('sums only in-cycle transactions by group', () => {
    const txns: Transaction[] = [
      { id: 't1', amount: 2000, categoryId: 'eating_out', date: '2026-08-05', source: 'manual' }, // in cycle, discretionary
      { id: 't2', amount: 5000, categoryId: 'utilities',  date: '2026-08-06', source: 'manual' }, // in cycle, bills
      { id: 't3', amount: 9999, categoryId: 'eating_out', date: '2026-07-01', source: 'manual' }, // before cycle -> excluded
    ];
    const s = cycleSummary(txns, cats, SEED_STATE.plan, SEED_STATE.income, cycle);
    expect(s.totalSpent).toBe(7000);
    expect(s.groups.find((g) => g.group === 'discretionary')!.spent).toBe(2000);
    expect(s.groups.find((g) => g.group === 'bills')!.spent).toBe(5000);
    expect(s.pctOfIncome).toBeCloseTo(7000 / 206500, 6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest cycleSummary`
Expected: FAIL — `Cannot find module '../cycleSummary'`.

- [ ] **Step 3: Implement the summary**

`packages/engine/src/cycleSummary.ts`:
```ts
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
```

- [ ] **Step 4: Update the barrel**

Append to `packages/engine/src/index.ts`:
```ts
export * from './cycleSummary';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest cycleSummary`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src
git commit -m "feat(engine): pay-cycle spend summary by group"
```

---

## Task 7: Spend room (Home)

**Files:**
- Create: `packages/engine/src/spendRoom.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/__tests__/spendRoom.test.ts`

**Interfaces:**
- Consumes: `Transaction`, `Category`, `BudgetPlan`, `Pence` from `@coast/core`; `PayCycle` from `./payCycle`.
- Produces: `interface SpendRoom { dailyRoom: Pence; leftUntilPayday: Pence; spentToday: Pence; onPace: boolean }`; `spendRoom(plan, transactions, categoriesById, cycle, ref): SpendRoom`.

- [ ] **Step 1: Write the failing test**

`packages/engine/src/__tests__/spendRoom.test.ts`:
```ts
import { spendRoom } from '../spendRoom';
import { payCycle } from '../payCycle';
import { SEED_STATE, categoriesById, Transaction } from '@coast/core';

const cats = categoriesById();
const ref = new Date('2026-08-09T12:00:00Z');
const cycle = payCycle(31, ref);

describe('spendRoom', () => {
  it('matches the reference screen: £178.86 left -> £8.13/day', () => {
    const r = spendRoom(SEED_STATE.plan, [], cats, cycle, ref);
    expect(r.leftUntilPayday).toBe(17886);
    expect(r.dailyRoom).toBe(813);
    expect(r.spentToday).toBe(0);
    expect(r.onPace).toBe(true);
  });
  it('only lifestyle spending reduces the room; today spend is tracked', () => {
    const txns: Transaction[] = [
      { id: 't1', amount: 1000, categoryId: 'eating_out',    date: '2026-08-09', source: 'manual' }, // lifestyle, today
      { id: 't2', amount: 5000, categoryId: 'utilities',     date: '2026-08-09', source: 'manual' }, // bills -> ignored
      { id: 't3', amount: 2000, categoryId: 'subscriptions', date: '2026-08-08', source: 'manual' }, // joy -> ignored
    ];
    const r = spendRoom(SEED_STATE.plan, txns, cats, cycle, ref);
    expect(r.leftUntilPayday).toBe(17886 - 1000);
    expect(r.spentToday).toBe(1000);
    expect(r.dailyRoom).toBe(Math.floor((17886 - 1000) / 22));
  });
  it('never goes negative when lifestyle is overspent', () => {
    const txns: Transaction[] = [
      { id: 't1', amount: 20000, categoryId: 'shopping', date: '2026-08-02', source: 'manual' },
    ];
    const r = spendRoom(SEED_STATE.plan, txns, cats, cycle, ref);
    expect(r.leftUntilPayday).toBe(0);
    expect(r.dailyRoom).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest spendRoom`
Expected: FAIL — `Cannot find module '../spendRoom'`.

- [ ] **Step 3: Implement spend room**

`packages/engine/src/spendRoom.ts`:
```ts
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
```

- [ ] **Step 4: Update the barrel**

Append to `packages/engine/src/index.ts`:
```ts
export * from './spendRoom';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest spendRoom`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src
git commit -m "feat(engine): daily spend room calculation"
```

---

## Task 8: Leaks

**Files:**
- Create: `packages/engine/src/leaks.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/__tests__/leaks.test.ts`

**Interfaces:**
- Consumes: `Leak`, `Transaction`, `Category`, `Pence` from `@coast/core`.
- Produces: `annualLeakTotal(leaks: Leak[]): Pence`; `leaksClosedAnnual(leaks: Leak[]): Pence`; `closeLeak(leaks: Leak[], id: string): Leak[]`; `detectLeaks(transactions: Transaction[], categoriesById: Record<string, Category>): { merchant: string; annual: Pence }[]`.

- [ ] **Step 1: Write the failing test**

`packages/engine/src/__tests__/leaks.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest leaks`
Expected: FAIL — `Cannot find module '../leaks'`.

- [ ] **Step 3: Implement leaks**

`packages/engine/src/leaks.ts`:
```ts
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
```

- [ ] **Step 4: Update the barrel**

Append to `packages/engine/src/index.ts`:
```ts
export * from './leaks';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest leaks`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src
git commit -m "feat(engine): leak totals + recurring-merchant detection"
```

---

## Task 9: Weekly statement

**Files:**
- Create: `packages/engine/src/weeklyStatement.ts`
- Modify: `packages/engine/src/index.ts`
- Test: `packages/engine/src/__tests__/weeklyStatement.test.ts`

**Interfaces:**
- Consumes: `Transaction`, `Category`, `Pence` from `@coast/core`.
- Produces: `type WeekdayLabel = 'MON'|'TUE'|'WED'|'THU'|'FRI'|'SAT'|'SUN'`; `interface DailyLedgerEntry { day: WeekdayLabel; date: string; scored: boolean; amount: Pence }`; `interface WeeklyStatementView { issueNumber: number; weekStart: string; weekEnd: string; daysScored: number; daysUnder: number; plannedSpend: Pence; actualSpend: Pence; leaksSpotted: Pence; movedForward: Pence; weeklyLine: Pence; weeklySpend: Pence; dailyLedger: DailyLedgerEntry[]; result: Pence; nextDailyLine: Pence; carry: Pence }`; `weeklyStatement(input): WeeklyStatementView`.

- [ ] **Step 1: Write the failing test**

`packages/engine/src/__tests__/weeklyStatement.test.ts`:
```ts
import { weeklyStatement } from '../weeklyStatement';
import { categoriesById, Transaction } from '@coast/core';

const cats = categoriesById();

describe('weeklyStatement', () => {
  it('renders the quiet reference week (W31) at zero', () => {
    const view = weeklyStatement({
      issueNumber: 31,
      weekStart: new Date('2026-07-27T00:00:00Z'),
      transactions: [],
      categoriesById: cats,
      weeklyLine: 0,
      currentDailyRoom: 813,
      leaksSpotted: 0,
    });
    expect(view.weekStart).toBe('2026-07-27');
    expect(view.weekEnd).toBe('2026-08-02');
    expect(view.dailyLedger).toHaveLength(7);
    expect(view.dailyLedger[0].day).toBe('MON');
    expect(view.dailyLedger.every((d) => !d.scored && d.amount === 0)).toBe(true);
    expect(view.daysScored).toBe(0);
    expect(view.daysUnder).toBe(0);
    expect(view.plannedSpend).toBe(0);
    expect(view.actualSpend).toBe(0);
    expect(view.movedForward).toBe(0);
    expect(view.result).toBe(0);
    expect(view.carry).toBe(0);
    expect(view.nextDailyLine).toBe(900); // ceil(£8.13) = £9
  });

  it('scores days against the line and moves savings forward', () => {
    const txns: Transaction[] = [
      { id: 'a', amount: 500,  categoryId: 'eating_out', date: '2026-07-28', source: 'manual' }, // Tue, under £9 line
      { id: 'b', amount: 1500, categoryId: 'shopping',   date: '2026-07-29', source: 'manual' }, // Wed, over £9 line
      { id: 'c', amount: 3000, categoryId: 'savings',    date: '2026-07-30', source: 'manual' }, // Thu, moved forward
    ];
    const view = weeklyStatement({
      issueNumber: 31,
      weekStart: new Date('2026-07-27T00:00:00Z'),
      transactions: txns,
      categoriesById: cats,
      weeklyLine: 6300, // £9 x 7
      currentDailyRoom: 900,
      leaksSpotted: 0,
    });
    expect(view.daysScored).toBe(7);
    expect(view.actualSpend).toBe(500 + 1500); // savings is a movement, not spend
    expect(view.movedForward).toBe(3000);
    expect(view.weeklyLine).toBe(6300);
    expect(view.result).toBe(6300 - 2000);
    const tue = view.dailyLedger.find((d) => d.day === 'TUE')!;
    expect(tue.scored).toBe(true);
    expect(tue.amount).toBe(500);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest weeklyStatement`
Expected: FAIL — `Cannot find module '../weeklyStatement'`.

- [ ] **Step 3: Implement the weekly statement**

`packages/engine/src/weeklyStatement.ts`:
```ts
import { Transaction, Category, Pence } from '@coast/core';

export type WeekdayLabel = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
const LABELS: WeekdayLabel[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MS_PER_DAY = 86_400_000;

export interface DailyLedgerEntry {
  day: WeekdayLabel;
  date: string;
  scored: boolean;
  amount: Pence;
}

export interface WeeklyStatementView {
  issueNumber: number;
  weekStart: string;
  weekEnd: string;
  daysScored: number;
  daysUnder: number;
  plannedSpend: Pence;
  actualSpend: Pence;
  leaksSpotted: Pence;
  movedForward: Pence;
  weeklyLine: Pence;
  weeklySpend: Pence;
  dailyLedger: DailyLedgerEntry[];
  result: Pence;
  nextDailyLine: Pence;
  carry: Pence;
}

export interface WeeklyStatementInput {
  issueNumber: number;
  weekStart: Date;   // Monday
  transactions: Transaction[];
  categoriesById: Record<string, Category>;
  weeklyLine: Pence; // planned line for this week (0 if pre-plan)
  currentDailyRoom: Pence;
  leaksSpotted: Pence;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function isSpend(t: Transaction, cats: Record<string, Category>): boolean {
  const group = cats[t.categoryId]?.group;
  return group === 'discretionary' || group === 'bills';
}

export function weeklyStatement(input: WeeklyStatementInput): WeeklyStatementView {
  const { issueNumber, weekStart, transactions, categoriesById, weeklyLine, currentDailyRoom, leaksSpotted } = input;
  const scored = weeklyLine > 0;
  const dailyLine = weeklyLine / 7;

  const dailyLedger: DailyLedgerEntry[] = LABELS.map((day, i) => {
    const date = iso(new Date(weekStart.getTime() + i * MS_PER_DAY));
    const amount = transactions
      .filter((t) => t.date === date && isSpend(t, categoriesById))
      .reduce((sum, t) => sum + t.amount, 0);
    return { day, date, scored, amount };
  });

  const actualSpend = dailyLedger.reduce((sum, e) => sum + e.amount, 0);
  const movedForward = transactions
    .filter((t) => categoriesById[t.categoryId]?.group === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  const daysScored = scored ? 7 : 0;
  const daysUnder = scored ? dailyLedger.filter((e) => e.amount <= dailyLine).length : 0;
  const result = weeklyLine - actualSpend;
  const nextDailyLine = Math.ceil(currentDailyRoom / 100) * 100;

  return {
    issueNumber,
    weekStart: iso(weekStart),
    weekEnd: iso(new Date(weekStart.getTime() + 6 * MS_PER_DAY)),
    daysScored,
    daysUnder,
    plannedSpend: weeklyLine,
    actualSpend,
    leaksSpotted,
    movedForward,
    weeklyLine,
    weeklySpend: actualSpend,
    dailyLedger,
    result,
    nextDailyLine,
    carry: result,
  };
}
```

- [ ] **Step 4: Update the barrel**

Append to `packages/engine/src/index.ts`:
```ts
export * from './weeklyStatement';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest weeklyStatement`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/engine/src
git commit -m "feat(engine): weekly statement builder"
```

---

## Task 10: CSV import parsing

**Files:**
- Create: `packages/core/src/categorize.ts`, `packages/core/src/csv.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/__tests__/csv.test.ts`

**Interfaces:**
- Consumes: `parseAmount` (Task 1), `CATEGORIES` (Task 2), types.
- Produces (`categorize.ts`): `categorize(description: string): string` (returns a categoryId, defaulting to `'uncategorised'`).
- Produces (`csv.ts`): `type BankFormat = 'amex' | 'revolut' | 'unknown'`; `interface ParsedTransaction { date: string; amount: Pence; merchant: string; categoryId: string }`; `interface CsvParseResult { format: BankFormat; rows: ParsedTransaction[] }`; `parseCsv(text: string): CsvParseResult`.

- [ ] **Step 1: Write the failing test**

`packages/core/src/__tests__/csv.test.ts`:
```ts
import { parseCsv } from '../csv';
import { categorize } from '../categorize';

const AMEX = `Date,Description,Amount
09/08/2026,TESCO STORES 1234,45.20
08/08/2026,NETFLIX.COM,9.99`;

const REVOLUT = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
CARD_PAYMENT,Current,2026-08-09 10:00:00,2026-08-09 10:00:01,Pret A Manger,-6.40,0.00,GBP,COMPLETED,100.00
TOPUP,Current,2026-08-08 09:00:00,2026-08-08 09:00:01,Salary,2000.00,0.00,GBP,COMPLETED,2100.00`;

describe('categorize', () => {
  it('maps known merchants to categories, else uncategorised', () => {
    expect(categorize('TESCO STORES 1234')).toBe('groceries');
    expect(categorize('NETFLIX.COM')).toBe('subscriptions');
    expect(categorize('Pret A Manger')).toBe('eating_out');
    expect(categorize('Something Unknown Ltd')).toBe('uncategorised');
  });
});

describe('parseCsv', () => {
  it('parses Amex charges as positive-pence spends', () => {
    const r = parseCsv(AMEX);
    expect(r.format).toBe('amex');
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toEqual({ date: '2026-08-09', amount: 4520, merchant: 'TESCO STORES 1234', categoryId: 'groceries' });
  });
  it('parses Revolut, keeping only outflows as spends', () => {
    const r = parseCsv(REVOLUT);
    expect(r.format).toBe('revolut');
    expect(r.rows).toHaveLength(1); // salary top-up excluded
    expect(r.rows[0]).toEqual({ date: '2026-08-09', amount: 640, merchant: 'Pret A Manger', categoryId: 'eating_out' });
  });
  it('returns unknown format with no rows for unrecognised input', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual({ format: 'unknown', rows: [] });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest csv`
Expected: FAIL — `Cannot find module '../csv'`.

- [ ] **Step 3: Implement categorize**

`packages/core/src/categorize.ts`:
```ts
const RULES: { pattern: RegExp; categoryId: string }[] = [
  { pattern: /tesco|sainsbury|aldi|lidl|asda|waitrose|morrison/i, categoryId: 'groceries' },
  { pattern: /uber|tfl|trainline|bus|rail|shell|bp /i,           categoryId: 'transport' },
  { pattern: /pharmacy|boots|nhs|dentist|gym/i,                  categoryId: 'health' },
  { pattern: /pret|greggs|mcdonald|nando|deliveroo|just ?eat|restaurant|cafe|coffee/i, categoryId: 'eating_out' },
  { pattern: /amazon|asos|zara|h&m|apple store|argos/i,          categoryId: 'shopping' },
  { pattern: /netflix|spotify|disney|prime video|youtube|icloud/i, categoryId: 'subscriptions' },
  { pattern: /cinema|odeon|vue|steam|playstation|xbox/i,         categoryId: 'fun' },
];

export function categorize(description: string): string {
  for (const rule of RULES) {
    if (rule.pattern.test(description)) return rule.categoryId;
  }
  return 'uncategorised';
}
```

- [ ] **Step 4: Implement the CSV parser**

`packages/core/src/csv.ts`:
```ts
import { Pence, parseAmount } from './money';
import { categorize } from './categorize';

export type BankFormat = 'amex' | 'revolut' | 'unknown';

export interface ParsedTransaction {
  date: string;    // ISO yyyy-mm-dd
  amount: Pence;   // positive = spend
  merchant: string;
  categoryId: string;
}

export interface CsvParseResult {
  format: BankFormat;
  rows: ParsedTransaction[];
}

// Minimal CSV line splitter that respects double-quoted fields.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(field); field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

function toIsoDate(raw: string): string {
  const s = raw.trim();
  // Revolut: "2026-08-09 10:00:00"
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  // Amex: "09/08/2026" (DD/MM/YYYY)
  const ukMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ukMatch) return `${ukMatch[3]}-${ukMatch[2]}-${ukMatch[1]}`;
  return s;
}

export function parseCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { format: 'unknown', rows: [] };
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());

  const isRevolut = header.includes('started date') && header.includes('amount');
  const isAmex = header.includes('date') && header.includes('description') && header.includes('amount') && !isRevolut;
  if (!isRevolut && !isAmex) return { format: 'unknown', rows: [] };

  const col = (name: string) => header.indexOf(name);
  const rows: ParsedTransaction[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const dateRaw = cells[col(isRevolut ? 'started date' : 'date')] ?? '';
    const merchant = cells[col('description')] ?? '';
    const amountRaw = cells[col('amount')] ?? '';
    const signed = parseAmount(amountRaw);

    if (isRevolut) {
      if (signed >= 0) continue; // keep only outflows
      rows.push({ date: toIsoDate(dateRaw), amount: Math.abs(signed), merchant, categoryId: categorize(merchant) });
    } else {
      if (signed <= 0) continue; // Amex charges are positive
      rows.push({ date: toIsoDate(dateRaw), amount: signed, merchant, categoryId: categorize(merchant) });
    }
  }

  return { format: isRevolut ? 'revolut' : 'amex', rows };
}
```

- [ ] **Step 5: Update the barrel**

Append to `packages/core/src/index.ts`:
```ts
export * from './categorize';
export * from './csv';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest csv`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): Amex/Revolut CSV import parsing + categorisation"
```

---

## Task 11: Persistence (serialize / deserialize / migrate)

**Files:**
- Create: `packages/core/src/persistence.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/__tests__/persistence.test.ts`

**Interfaces:**
- Consumes: `CoastState`, `SEED_STATE`.
- Produces: `const SCHEMA_VERSION = 1`; `serialize(state: CoastState): string`; `deserialize(json: string): CoastState` (throws on malformed JSON; returns `SEED_STATE` clone if shape invalid); `migrate(state: CoastState): CoastState`.

- [ ] **Step 1: Write the failing test**

`packages/core/src/__tests__/persistence.test.ts`:
```ts
import { serialize, deserialize, SCHEMA_VERSION } from '../persistence';
import { SEED_STATE } from '../seed';

describe('persistence', () => {
  it('round-trips the seed state unchanged', () => {
    const restored = deserialize(serialize(SEED_STATE));
    expect(restored).toEqual(SEED_STATE);
  });
  it('exposes the current schema version', () => {
    expect(SEED_STATE.schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('falls back to a fresh seed when the shape is invalid', () => {
    const restored = deserialize('{"nonsense": true}');
    expect(restored.income.monthly).toBe(SEED_STATE.income.monthly);
    expect(restored).not.toBe(SEED_STATE); // a copy, not the shared reference
  });
  it('throws on non-JSON input', () => {
    expect(() => deserialize('not json')).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest persistence`
Expected: FAIL — `Cannot find module '../persistence'`.

- [ ] **Step 3: Implement persistence**

`packages/core/src/persistence.ts`:
```ts
import { CoastState } from './types';
import { SEED_STATE } from './seed';

export const SCHEMA_VERSION = 1;

export function serialize(state: CoastState): string {
  return JSON.stringify(state);
}

function isCoastState(value: unknown): value is CoastState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.schemaVersion === 'number' &&
    typeof v.income === 'object' && v.income !== null &&
    typeof v.plan === 'object' && v.plan !== null &&
    Array.isArray(v.transactions) &&
    Array.isArray(v.categories)
  );
}

export function migrate(state: CoastState): CoastState {
  // v1 is current; future versions add cases here.
  return { ...state, schemaVersion: SCHEMA_VERSION };
}

export function deserialize(json: string): CoastState {
  const parsed = JSON.parse(json); // throws on non-JSON, by design
  if (!isCoastState(parsed)) {
    return JSON.parse(JSON.stringify(SEED_STATE)) as CoastState;
  }
  return migrate(parsed);
}
```

- [ ] **Step 4: Update the barrel**

Append to `packages/core/src/index.ts`:
```ts
export * from './persistence';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest persistence`
Expected: PASS.

- [ ] **Step 6: Run the whole suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all suites PASS; `tsc` reports no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src
git commit -m "feat(core): state serialization with schema-version fallback"
```

---

## Task 12: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: root `npm test` and `npm run typecheck` scripts.

- [ ] **Step 1: Write the workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run typecheck
      - run: npm test
```

- [ ] **Step 2: Verify the commands locally**

Run: `npm run typecheck && npm test`
Expected: both PASS (this mirrors what CI runs).

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: typecheck + engine/core tests on push and PR"
git push
```

---

## Self-Review

**Spec coverage (foundation slice of `2026-08-09-coast-design.md`):**
- §4 monorepo (`packages/engine`, `packages/core`) → Tasks 1, 4.
- §5 engine: payCycle → T4; spendRoom → T7; cycleSummary → T6; planBreakdown → T5; leakDetector → T8; weeklyStatement → T9; money → T1.
- §6 data model types → T2; seed → T3.
- §8 CSV parsing/categorisation → T10.
- §4 persistence contract → T11.
- §10 Jest + CI → all tasks + T12.
- UI screens, onboarding, notifications, widget, landing → **deferred to Plans 2–5** (out of scope for this plan by design; see roadmap).

**Placeholder scan:** No "TBD/TODO/handle edge cases" left; every code and test step contains concrete content.

**Type consistency check:** `Pence` used everywhere for money. `PayCycle` fields (`start`, `nextPayday`, `displayEnd`, `daysUntilPayday`, `cycleLengthDays`) are referenced identically in T6/T7. `categoriesById()` (Task 2) is the map builder consumed by T6/T7/T8/T9. `Category.subpool === 'lifestyle'` drives both spendRoom (T7) and is defined in types (T2) + catalog (T2). `parseAmount`/`Pence` from money (T1) reused by csv (T10). Seed field names (`plan.lifestyle`, `income.paydayDom`, `leaks[].annual`) match the types in T2 and the consumers in T3/T7/T8. No signature drift found.
