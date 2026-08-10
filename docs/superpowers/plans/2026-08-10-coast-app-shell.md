# Coast App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Expo (React Native + TypeScript) mobile app in the existing monorepo — Metro wired to the `@coast/*` packages, a design-token/theme layer, a Zustand store bound to `@coast/engine` with AsyncStorage persistence, reusable primitives, and a 5-tab navigation shell whose placeholder screens read real values from the store — then launch it in the iOS Simulator.

**Architecture:** `apps/mobile` consumes `@coast/core` and `@coast/engine` from source via Metro workspace config. All business logic stays in the packages and in pure store selectors (which wrap the engine and take an injected `now: Date`); React components are thin and read from the store. Money is always rendered through a `Money` component (`formatGBP`). Persistence serializes the whole `CoastState` to a single AsyncStorage key using core's `serialize`/`deserialize`.

**Tech Stack:** Expo SDK (current), expo-router (file-based tabs), React Native, TypeScript (strict), Zustand (`zustand/vanilla` store + `useStore` hook), `@react-native-async-storage/async-storage`, Archivo + Inter via `@expo-google-fonts/*`. Jest (existing ts-jest, node) for pure logic; `expo export` bundling + iOS Simulator for UI verification.

## Global Constraints

- **Reuse, don't rebuild:** all finance math comes from `@coast/engine`; all models/seed/persistence from `@coast/core`. Do not reimplement any of it in the app.
- **Money is integer pence.** Render money only through the `Money` component / `formatGBP`. Never format currency inline.
- **Determinism.** Selectors that depend on "today" take a `now: Date` parameter — no `Date.now()`/argless `new Date()` inside pure store/selector code. The React layer passes the real current date at the edge.
- **No hardcoded style values in components.** Colors, spacing, radii, and type come from `src/design/tokens.ts` / `theme.ts`. A raw hex or magic pixel literal in a component is a defect.
- **Thin components.** Screens/components read derived values from selectors/store and render; they contain no finance logic.
- **Package versions:** install RN/Expo/native deps with `npx expo install <pkg>` (SDK-compatible resolution). Do NOT hand-pin React Native / Expo / native module versions.
- **TypeScript strict** everywhere. Existing root scripts: `npm run typecheck`, `npm test`. The suite must stay green and pristine.
- **Palette (from design spec, tokens.ts is the source of truth):** sand `#E9E4D8`, card `#F2EEE4`, ink `#1A1A1A`, muted ink `#6B6B63`, hairline `#D8D2C4`, accent teal `#0F6E6E`, savings green `#2E7D5B`, debt amber `#D98A3D`, joy coral `#E4694E`, tab bar `#111111`.
- **Reference values (must surface correctly through the store on seed data + ref date `2026-08-09T12:00:00Z`):** spend room `dailyRoom = 813` (£8.13), plan breakdown `total = 206500` (£2,065), `daysUntilPayday = 22`, open leaks `286000` (£2,860).

---

## Scope note

This plan is the **shell only**: navigation, store/persistence wiring, design system, and placeholder tab screens that prove end-to-end data flow (e.g. Home shows the real spend-room figure). The full per-tab UIs (Home hero, Activity list, Payments calendar, Plan donut, Profile, Weekly Statement) are **Plan 3**. Onboarding/recording are **Plan 4**; polish is **Plan 5**.

## File structure

```
apps/mobile/
  package.json            # name @coast/mobile, main "expo-router/entry"
  app.json                # Expo config (scheme, expo-router plugin)
  babel.config.js         # babel-preset-expo
  metro.config.js         # monorepo: watchFolders=root, symlinks, nodeModulesPaths
  tsconfig.json           # extends expo/tsconfig.base, strict
  app/
    _layout.tsx           # root: load fonts, hydrate store from storage, splash gate
    (tabs)/
      _layout.tsx         # Tabs navigator: 5 tabs + dark tab bar
      index.tsx           # Home placeholder (shows spend room from store)
      activity.tsx        # placeholder (shows cycle total)
      payments.tsx        # placeholder (shows recurring total)
      plan.tsx            # placeholder (shows donut total)
      profile.tsx         # placeholder (shows name + leaks)
  src/
    design/
      tokens.ts           # colors, space, radius, type scale  (pure)
      theme.ts            # semantic theme from tokens          (pure)
      fonts.ts            # @expo-google-fonts font map
      primitives/
        Screen.tsx        # safe-area cream screen container
        Text.tsx          # themed text with type variants
        Money.tsx         # renders Pence via formatGBP
        Card.tsx
        PillButton.tsx
    store/
      selectors.ts        # pure engine-wrapping selectors      (pure)
      store.ts            # zustand vanilla store + actions + useCoastStore
      persistence.ts      # KeyValueStore DI + load/save via core (pure logic)
      asyncStorage.ts     # AsyncStorage impl of KeyValueStore (app-side)
    __tests__/
      tokens.test.ts
      selectors.test.ts
      store.test.ts
      persistence.test.ts
```

---

## Task 1: Expo app scaffold + Metro monorepo wiring

**Files:**
- Create: `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/babel.config.js`, `apps/mobile/metro.config.js`, `apps/mobile/tsconfig.json`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`
- Modify: root `package.json` (add an `app` script), root `tsconfig` references are not required (Expo app is not part of `tsc -b`)

**Interfaces:**
- Produces: a bundleable Expo app that imports `formatGBP` from `@coast/engine` and renders it, proving cross-package resolution.

- [ ] **Step 1: Scaffold the app package**

Create `apps/mobile/package.json`:
```json
{
  "name": "@coast/mobile",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "bundle:ios": "expo export --platform ios --output-dir /tmp/coast-export"
  }
}
```

- [ ] **Step 2: Install Expo + deps (SDK-compatible)**

From the repo root:
```bash
npx create-expo-app@latest apps/mobile --template blank-typescript --no-install
```
If the directory already has the package.json above, instead initialize Expo into it. Then, from `apps/mobile`, install the shell deps with Expo's resolver:
```bash
cd apps/mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-font expo-splash-screen @react-native-async-storage/async-storage @expo-google-fonts/archivo @expo-google-fonts/inter
npm install zustand
```
Then run `npm install` at the repo root so workspaces link `@coast/core` and `@coast/engine` into `apps/mobile`.

If `create-expo-app` refuses a non-empty dir, scaffold in a temp dir and move the generated `app.json`/`babel.config.js` in, keeping the `package.json` above. Report exact commands in the report.

- [ ] **Step 3: Configure Metro for the monorepo**

Create `apps/mobile/metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
```

Create `apps/mobile/app.json`:
```json
{
  "expo": {
    "name": "Coast",
    "slug": "coast",
    "scheme": "coast",
    "version": "0.0.1",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "plugins": ["expo-router"],
    "ios": { "supportsTablet": false },
    "splash": { "backgroundColor": "#E9E4D8" }
  }
}
```

Create `apps/mobile/babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
```

Create `apps/mobile/tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "."
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 4: Minimal root + placeholder that proves package resolution**

Create `apps/mobile/app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Create `apps/mobile/app/index.tsx`:
```tsx
import { Text, View } from 'react-native';
import { formatGBP } from '@coast/core';

export default function Boot() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9E4D8' }}>
      <Text style={{ fontSize: 48, fontWeight: '800', color: '#1A1A1A' }}>{formatGBP(813)}</Text>
      <Text style={{ color: '#0F6E6E' }}>Coast shell — packages wired</Text>
    </View>
  );
}
```
(`formatGBP`, `MoneyMode`, `Pence` are exported by `@coast/core`; the engine does not re-export them. This import also exercises the second workspace package once selectors land.)

- [ ] **Step 5: Verify it bundles (no simulator needed)**

Run from `apps/mobile`:
```bash
npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: bundling completes with no module-resolution or transpile errors, and `/tmp/coast-export` is produced. This proves Metro resolves `@coast/engine` from source across the workspace. Also run root `npm run typecheck` (unchanged packages must still pass) and confirm the app typechecks: `cd apps/mobile && npx tsc --noEmit`.

If bundling fails on symlink/resolution, adjust `metro.config.js` per the error (common fixes: ensure `unstable_enableSymlinks`, ensure root `npm install` linked the packages) and report what was needed.

- [ ] **Step 6: Ignore build output + commit**

Ensure `/tmp/coast-export` is outside the repo (it is). Confirm `.gitignore` covers `.expo/`, `apps/*/node_modules` (root `.gitignore` already has `node_modules/` and `.expo/`). Then:
```bash
git add apps/mobile package.json package-lock.json
git commit -m "feat(mobile): scaffold Expo app + Metro monorepo wiring"
```
Do NOT `git add` any `node_modules`, `.expo`, or export output.

---

## Task 2: Design tokens + theme (+ enable app tests in Jest)

**Files:**
- Create: `apps/mobile/src/design/tokens.ts`, `apps/mobile/src/design/theme.ts`, `apps/mobile/src/__tests__/tokens.test.ts`
- Modify: root `jest.config.js` (add `apps/mobile/src` to `roots`)

**Interfaces:**
- Produces (`tokens.ts`): `colors` (const object), `space`, `radius`, `type` (type-scale objects). All `as const`.
- Produces (`theme.ts`): `theme` object grouping semantic roles: `theme.bg`, `theme.card`, `theme.text`, `theme.textMuted`, `theme.accent`, `theme.line`, `theme.tabBar`, `theme.categoryColors` (by group), plus `space`, `radius`, `type` re-exported.

- [ ] **Step 1: Enable app-src tests**

Edit root `jest.config.js` — change `roots` to include the app's source:
```js
roots: ['<rootDir>/packages', '<rootDir>/apps/mobile/src'],
```
(Keep `testPathIgnorePatterns`/`modulePathIgnorePatterns`, `transform`, and `moduleNameMapper` exactly as they are. Only pure `.ts` files under `apps/mobile/src` will be tested — no React Native imports in tested modules.)

- [ ] **Step 2: Write the failing test**

`apps/mobile/src/__tests__/tokens.test.ts`:
```ts
import { colors, space, radius } from '../design/tokens';
import { theme } from '../design/theme';

describe('design tokens', () => {
  it('exposes the Coast palette', () => {
    expect(colors.sand).toBe('#E9E4D8');
    expect(colors.ink).toBe('#1A1A1A');
    expect(colors.teal).toBe('#0F6E6E');
    expect(colors.tabBar).toBe('#111111');
  });
  it('has an ascending spacing scale', () => {
    const scale = [space.xs, space.sm, space.md, space.lg, space.xl, space.xxl];
    for (let i = 1; i < scale.length; i++) expect(scale[i]).toBeGreaterThan(scale[i - 1]);
  });
  it('has a pill radius', () => {
    expect(radius.pill).toBeGreaterThanOrEqual(999);
  });
});

describe('theme', () => {
  it('maps semantic roles onto palette colours', () => {
    expect(theme.bg).toBe(colors.sand);
    expect(theme.accent).toBe(colors.teal);
    expect(theme.tabBar).toBe(colors.tabBar);
    expect(theme.categoryColors.savings).toBe(colors.green);
    expect(theme.categoryColors.discretionary).toBe(colors.teal);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest tokens`
Expected: FAIL — `Cannot find module '../design/tokens'`.

- [ ] **Step 4: Implement tokens + theme**

`apps/mobile/src/design/tokens.ts`:
```ts
export const colors = {
  sand: '#E9E4D8',
  card: '#F2EEE4',
  ink: '#1A1A1A',
  inkMuted: '#6B6B63',
  line: '#D8D2C4',
  teal: '#0F6E6E',
  green: '#2E7D5B',
  amber: '#D98A3D',
  coral: '#E4694E',
  tabBar: '#111111',
  onDark: '#F2EEE4',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export const type = {
  hero:  { family: 'Archivo_800ExtraBold', size: 56, line: 60 },
  title: { family: 'Archivo_700Bold',      size: 28, line: 32 },
  stat:  { family: 'Archivo_700Bold',      size: 34, line: 38 },
  label: { family: 'Inter_600SemiBold',    size: 13, line: 16, letter: 1 },
  body:  { family: 'Inter_400Regular',     size: 16, line: 22 },
} as const;
```

`apps/mobile/src/design/theme.ts`:
```ts
import { colors, space, radius, type } from './tokens';

export const theme = {
  bg: colors.sand,
  card: colors.card,
  text: colors.ink,
  textMuted: colors.inkMuted,
  accent: colors.teal,
  line: colors.line,
  tabBar: colors.tabBar,
  onDark: colors.onDark,
  categoryColors: {
    bills: colors.ink,
    savings: colors.green,
    debt: colors.amber,
    discretionary: colors.teal,
  },
  space,
  radius,
  type,
} as const;

export type Theme = typeof theme;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest tokens`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add jest.config.js apps/mobile/src/design apps/mobile/src/__tests__/tokens.test.ts
git commit -m "feat(mobile): design tokens + semantic theme"
```

---

## Task 3: Store selectors (pure engine wrappers)

**Files:**
- Create: `apps/mobile/src/store/selectors.ts`, `apps/mobile/src/__tests__/selectors.test.ts`

**Interfaces:**
- Consumes: `@coast/core` (`CoastState`, `categoriesById`, `Pence`), `@coast/engine` (`payCycle`, `spendRoom`, `cycleSummary`, `planBreakdown`, `annualLeakTotal`, `leaksClosedAnnual`, and their result types).
- Produces: `selectPayCycle(state, now)`, `selectSpendRoom(state, now)`, `selectCycleSummary(state, now)`, `selectPlanBreakdown(state)`, `selectDaysUntilPayday(state, now)`, `selectRecurringTotal(state)`, `selectLeaksAnnual(state)`, `selectLeaksClosedAnnual(state)`.

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/__tests__/selectors.test.ts`:
```ts
import { SEED_STATE } from '@coast/core';
import {
  selectSpendRoom,
  selectPlanBreakdown,
  selectDaysUntilPayday,
  selectRecurringTotal,
  selectLeaksAnnual,
} from '../store/selectors';

const now = new Date('2026-08-09T12:00:00Z');

describe('store selectors', () => {
  it('surfaces the reference spend room from seed', () => {
    expect(selectSpendRoom(SEED_STATE, now).dailyRoom).toBe(813);
    expect(selectDaysUntilPayday(SEED_STATE, now)).toBe(22);
  });
  it('surfaces the plan donut total', () => {
    expect(selectPlanBreakdown(SEED_STATE).total).toBe(206500);
  });
  it('sums recurring payments and open leaks', () => {
    expect(selectRecurringTotal(SEED_STATE)).toBe(152000);
    expect(selectLeaksAnnual(SEED_STATE)).toBe(286000);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest selectors`
Expected: FAIL — `Cannot find module '../store/selectors'`.

- [ ] **Step 3: Implement selectors**

`apps/mobile/src/store/selectors.ts`:
```ts
import { CoastState, categoriesById, Pence } from '@coast/core';
import {
  payCycle, PayCycle,
  spendRoom, SpendRoom,
  cycleSummary, CycleSummary,
  planBreakdown, PlanBreakdown,
  annualLeakTotal, leaksClosedAnnual,
} from '@coast/engine';

export function selectPayCycle(state: CoastState, now: Date): PayCycle {
  return payCycle(state.income.paydayDom, now);
}

export function selectSpendRoom(state: CoastState, now: Date): SpendRoom {
  return spendRoom(
    state.plan,
    state.transactions,
    categoriesById(state.categories),
    selectPayCycle(state, now),
    now,
  );
}

export function selectCycleSummary(state: CoastState, now: Date): CycleSummary {
  return cycleSummary(
    state.transactions,
    categoriesById(state.categories),
    state.plan,
    state.income,
    selectPayCycle(state, now),
  );
}

export function selectPlanBreakdown(state: CoastState): PlanBreakdown {
  return planBreakdown(state.plan);
}

export function selectDaysUntilPayday(state: CoastState, now: Date): number {
  return selectPayCycle(state, now).daysUntilPayday;
}

export function selectRecurringTotal(state: CoastState): Pence {
  return state.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function selectLeaksAnnual(state: CoastState): Pence {
  return annualLeakTotal(state.leaks);
}

export function selectLeaksClosedAnnual(state: CoastState): Pence {
  return leaksClosedAnnual(state.leaks);
}
```
(If any engine result type name here differs from what `@coast/engine` actually exports, use the exported name — check the barrel.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest selectors`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/store/selectors.ts apps/mobile/src/__tests__/selectors.test.ts
git commit -m "feat(mobile): pure store selectors over the engine"
```

---

## Task 4: Zustand store + actions

**Files:**
- Create: `apps/mobile/src/store/store.ts`, `apps/mobile/src/__tests__/store.test.ts`

**Interfaces:**
- Consumes: `@coast/core` (`CoastState`, `SEED_STATE`, `Transaction`, `Income`, `BudgetPlan`, `Leak`), `@coast/engine` (`closeLeak`), `zustand/vanilla` (`createStore`), `zustand` (`useStore`).
- Produces: `interface CoastStore { data: CoastState; hydrate(next: CoastState): void; addTransaction(t: Transaction): void; completeOnboarding(income: Income, plan: BudgetPlan): void; stampStatement(id: string): void; closeLeakById(id: string): void; reset(): void }`; `coastStore` (vanilla store); `useCoastStore<T>(selector: (s: CoastStore) => T): T`.

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/__tests__/store.test.ts`:
```ts
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
    expect(coastStore.getState().data.statements.find((s) => s.id === 'stmt_w31')!.status).toBe('stamped');
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest store`
Expected: FAIL — `Cannot find module '../store/store'`.

- [ ] **Step 3: Implement the store**

`apps/mobile/src/store/store.ts`:
```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest store`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/store/store.ts apps/mobile/src/__tests__/store.test.ts
git commit -m "feat(mobile): zustand store with pure state actions"
```

---

## Task 5: Persistence adapter

**Files:**
- Create: `apps/mobile/src/store/persistence.ts`, `apps/mobile/src/store/asyncStorage.ts`, `apps/mobile/src/__tests__/persistence.test.ts`

**Interfaces:**
- Consumes: `@coast/core` (`CoastState`, `SEED_STATE`, `serialize`, `deserialize`).
- Produces (`persistence.ts`): `interface KeyValueStore { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void> }`; `const STORAGE_KEY = 'coast/state/v1'`; `loadState(kv: KeyValueStore): Promise<CoastState>`; `saveState(kv: KeyValueStore, state: CoastState): Promise<void>`.
- Produces (`asyncStorage.ts`): `asyncStorageKV: KeyValueStore` (wraps `@react-native-async-storage/async-storage`). Not imported by tests.

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/__tests__/persistence.test.ts`:
```ts
import { SEED_STATE } from '@coast/core';
import { KeyValueStore, STORAGE_KEY, loadState, saveState } from '../store/persistence';

function memoryKV(seed: Record<string, string> = {}): KeyValueStore {
  const map = new Map(Object.entries(seed));
  return {
    getItem: async (k) => (map.has(k) ? map.get(k)! : null),
    setItem: async (k, v) => { map.set(k, v); },
  };
}

describe('persistence', () => {
  it('round-trips saved state', async () => {
    const kv = memoryKV();
    await saveState(kv, SEED_STATE);
    expect(await loadState(kv)).toEqual(SEED_STATE);
  });
  it('returns a fresh seed copy when nothing is stored', async () => {
    const loaded = await loadState(memoryKV());
    expect(loaded.income.monthly).toBe(SEED_STATE.income.monthly);
    expect(loaded).not.toBe(SEED_STATE);
  });
  it('falls back to seed on corrupt data instead of throwing', async () => {
    const loaded = await loadState(memoryKV({ [STORAGE_KEY]: 'not json' }));
    expect(loaded.income.monthly).toBe(SEED_STATE.income.monthly);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest persistence`
Expected: FAIL — `Cannot find module '../store/persistence'`. (Note: this test lives in `apps/mobile/src/__tests__`; the core persistence test is separate and still passes.)

- [ ] **Step 3: Implement persistence + the AsyncStorage adapter**

`apps/mobile/src/store/persistence.ts`:
```ts
import { CoastState, SEED_STATE, serialize, deserialize } from '@coast/core';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const STORAGE_KEY = 'coast/state/v1';

const freshSeed = (): CoastState => JSON.parse(JSON.stringify(SEED_STATE));

export async function loadState(kv: KeyValueStore): Promise<CoastState> {
  const raw = await kv.getItem(STORAGE_KEY);
  if (raw == null) return freshSeed();
  try {
    return deserialize(raw);
  } catch {
    return freshSeed();
  }
}

export async function saveState(kv: KeyValueStore, state: CoastState): Promise<void> {
  await kv.setItem(STORAGE_KEY, serialize(state));
}
```

`apps/mobile/src/store/asyncStorage.ts`:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyValueStore } from './persistence';

export const asyncStorageKV: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest persistence`
Expected: PASS (both the app persistence suite and the core persistence suite are green).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/store/persistence.ts apps/mobile/src/store/asyncStorage.ts apps/mobile/src/__tests__/persistence.test.ts
git commit -m "feat(mobile): state persistence via injectable key-value store"
```

---

## Task 6: Design primitives

**Files:**
- Create: `apps/mobile/src/design/primitives/Screen.tsx`, `Text.tsx`, `Money.tsx`, `Card.tsx`, `PillButton.tsx`
- Test: bundle + typecheck (React Native components; no jest here — verified by `expo export` and `tsc`)

**Interfaces:**
- Produces: `<Screen>` (safe-area cream container), `<AppText variant="hero|title|stat|label|body" muted?>`, `<Money pence variant? mode?>` (renders `formatGBP`), `<Card>`, `<PillButton label onPress variant?>`.

- [ ] **Step 1: Implement the primitives**

`apps/mobile/src/design/primitives/Text.tsx`:
```tsx
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { theme } from '../theme';

type Variant = keyof typeof theme.type;

export function AppText({ variant = 'body', muted, style, ...rest }: TextProps & { variant?: Variant; muted?: boolean }) {
  const t = theme.type[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: t.family,
          fontSize: t.size,
          lineHeight: t.line,
          color: muted ? theme.textMuted : theme.text,
          letterSpacing: 'letter' in t ? (t as { letter: number }).letter : 0,
        },
        style,
      ]}
    />
  );
}

export const styles = StyleSheet.create({});
```

`apps/mobile/src/design/primitives/Money.tsx`:
```tsx
import { formatGBP, MoneyMode } from '@coast/core';
import { AppText } from './Text';
import { theme } from '../theme';

type Variant = keyof typeof theme.type;

export function Money({ pence, mode = 'auto', variant = 'stat' }: { pence: number; mode?: MoneyMode; variant?: Variant }) {
  return <AppText variant={variant}>{formatGBP(pence, mode)}</AppText>;
}
```

`apps/mobile/src/design/primitives/Screen.tsx`:
```tsx
import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[{ flex: 1, paddingHorizontal: theme.space.xl }, style]}>{children}</View>
    </SafeAreaView>
  );
}
```

`apps/mobile/src/design/primitives/Card.tsx`:
```tsx
import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        { backgroundColor: theme.card, borderRadius: theme.radius.lg, padding: theme.space.xl },
        style,
      ]}
    >
      {children}
    </View>
  );
}
```

`apps/mobile/src/design/primitives/PillButton.tsx`:
```tsx
import { Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function PillButton({ label, onPress, variant = 'dark' }: { label: string; onPress?: () => void; variant?: 'dark' | 'accent' }) {
  const bg = variant === 'accent' ? theme.accent : theme.text;
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: bg, borderRadius: theme.radius.pill, paddingVertical: theme.space.lg, paddingHorizontal: theme.space.xxl, alignItems: 'center' }}
    >
      <AppText variant="label" style={{ color: theme.onDark }}>{label}</AppText>
    </Pressable>
  );
}
```

- [ ] **Step 2: Verify bundle + typecheck**

Run from `apps/mobile`:
```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: typecheck clean; bundle succeeds (primitives compile and are tree-shaken in — no runtime import errors). Also run root `npm test` to confirm the pure suites are still green.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/design/primitives
git commit -m "feat(mobile): design-system primitives (Screen, Text, Money, Card, PillButton)"
```

---

## Task 7: Fonts + root layout with store hydration

**Files:**
- Create: `apps/mobile/src/design/fonts.ts`
- Modify: `apps/mobile/app/_layout.tsx`

**Interfaces:**
- Consumes: `@expo-google-fonts/archivo`, `@expo-google-fonts/inter`, `expo-font`, `expo-splash-screen`, the store (`coastStore`), persistence (`loadState`, `asyncStorageKV`).
- Produces (`fonts.ts`): `fontMap` (family name → asset) matching the family strings used in `tokens.ts` (`Archivo_700Bold`, `Archivo_800ExtraBold`, `Inter_400Regular`, `Inter_600SemiBold`).

- [ ] **Step 1: Implement the font map**

`apps/mobile/src/design/fonts.ts`:
```ts
import { Archivo_700Bold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

export const fontMap = {
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Inter_400Regular,
  Inter_600SemiBold,
};
```

- [ ] **Step 2: Load fonts + hydrate the store before rendering**

`apps/mobile/app/_layout.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fontMap } from '../src/design/fonts';
import { coastStore } from '../src/store/store';
import { loadState } from '../src/store/persistence';
import { asyncStorageKV } from '../src/store/asyncStorage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadState(asyncStorageKV)
      .then((state) => coastStore.getState().hydrate(state))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Verify bundle + typecheck**

Run from `apps/mobile`:
```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: typecheck clean; bundle succeeds (font packages + splash + store hydration wire up without resolution errors).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/design/fonts.ts apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): font loading + store hydration on launch"
```

---

## Task 8: Tab navigator + placeholder screens wired to the store

**Files:**
- Create: `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(tabs)/index.tsx`, `activity.tsx`, `payments.tsx`, `plan.tsx`, `profile.tsx`
- Delete: `apps/mobile/app/index.tsx` (replaced by the tab group's index)

**Interfaces:**
- Consumes: `expo-router` (`Tabs`), `@expo/vector-icons` (Ionicons — ships with Expo), the store hook (`useCoastStore`), selectors, primitives, `theme`.
- Produces: a 5-tab shell with a dark tab bar; each screen renders one real store-derived value to prove wiring.

- [ ] **Step 1: Implement the tab layout (dark bar, 5 icons)**

`apps/mobile/app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/design/theme';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  activity: 'trending-up',
  payments: 'card',
  plan: 'pie-chart',
  profile: 'person',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.onDark,
        tabBarInactiveTintColor: '#6E6E6E',
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopWidth: 0 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={size} color={color} />
        ),
      })}
    />
  );
}
```

- [ ] **Step 2: Implement the five placeholder screens (each shows a real value)**

`apps/mobile/app/(tabs)/index.tsx` (Home — spend room):
```tsx
import { useCoastStore } from '../../src/store/store';
import { selectSpendRoom } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';

export default function Home() {
  const data = useCoastStore((s) => s.data);
  const room = selectSpendRoom(data, new Date());
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: 24 }}>TODAY'S SPEND ROOM</AppText>
      <Money pence={room.dailyRoom} variant="hero" />
      <AppText variant="body" muted>Coast shell — Home</AppText>
    </Screen>
  );
}
```

`apps/mobile/app/(tabs)/activity.tsx`:
```tsx
import { useCoastStore } from '../../src/store/store';
import { selectCycleSummary } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';

export default function Activity() {
  const data = useCoastStore((s) => s.data);
  const summary = selectCycleSummary(data, new Date());
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: 24 }}>SPENT THIS PAY CYCLE</AppText>
      <Money pence={summary.totalSpent} variant="hero" />
      <AppText variant="body" muted>Coast shell — Activity</AppText>
    </Screen>
  );
}
```

`apps/mobile/app/(tabs)/payments.tsx`:
```tsx
import { useCoastStore } from '../../src/store/store';
import { selectRecurringTotal } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';

export default function Payments() {
  const data = useCoastStore((s) => s.data);
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: 24 }}>RECURRING</AppText>
      <Money pence={selectRecurringTotal(data)} variant="hero" />
      <AppText variant="body" muted>Coast shell — Payments</AppText>
    </Screen>
  );
}
```

`apps/mobile/app/(tabs)/plan.tsx`:
```tsx
import { useCoastStore } from '../../src/store/store';
import { selectPlanBreakdown } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';

export default function Plan() {
  const data = useCoastStore((s) => s.data);
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: 24 }}>MONTHLY PLAN</AppText>
      <Money pence={selectPlanBreakdown(data).total} variant="hero" />
      <AppText variant="body" muted>Coast shell — Plan</AppText>
    </Screen>
  );
}
```

`apps/mobile/app/(tabs)/profile.tsx`:
```tsx
import { useCoastStore } from '../../src/store/store';
import { selectLeaksAnnual } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';

export default function Profile() {
  const data = useCoastStore((s) => s.data);
  return (
    <Screen>
      <AppText variant="title" style={{ marginTop: 24 }}>{data.profileName}</AppText>
      <AppText variant="label" muted>YOUR LEAKS</AppText>
      <Money pence={selectLeaksAnnual(data)} variant="stat" />
      <AppText variant="body" muted>Coast shell — Profile</AppText>
    </Screen>
  );
}
```

- [ ] **Step 3: Remove the old boot screen**

```bash
git rm apps/mobile/app/index.tsx
```
(The `(tabs)/index.tsx` route now owns `/`.)

- [ ] **Step 4: Verify bundle + typecheck**

Run from `apps/mobile`:
```bash
npx tsc --noEmit
npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: typecheck clean; bundle succeeds. Run root `npm test` — all pure suites still green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app
git commit -m "feat(mobile): 5-tab shell wired to the store"
```

---

## Post-plan acceptance (controller, not a subagent task)

After Task 8, the controller launches the app in the iOS Simulator to confirm it renders:
1. `cd apps/mobile && npx expo start --ios` (or attach the simulator panel and run the dev build).
2. Confirm: the app boots past splash (fonts loaded), the dark 5-tab bar shows, Home reads **£8.13**, Plan reads **£2,065**, Payments reads **£1,520**, Profile shows **Snigdha** + **£2,860**. Capture a screenshot.
3. If the simulator can't run in this environment, the `expo export` bundle + typecheck stand as the automated acceptance and the visual check is deferred to the user's machine (documented).

---

## Self-Review

**Spec coverage (design spec §4 architecture / §9 design system, app-shell slice):**
- Expo app + monorepo Metro wiring → Task 1.
- Design tokens + theme (palette, type) → Task 2.
- Store bound to engine (selectors) → Task 3; Zustand store + actions → Task 4.
- Persistence via AsyncStorage using core serialize/deserialize → Task 5.
- Primitives (Screen, Text/Money, Card, PillButton) → Task 6.
- Fonts + hydrate-on-launch → Task 7.
- 5-tab navigation shell (dark bar) reading real store values → Task 8.
- Per-tab full UIs, onboarding, recording, polish → explicitly deferred to Plans 3–5 (scope note).

**Placeholder scan:** No TBD/TODO. Every code + test step has concrete content. RN component tasks (1, 6, 7, 8) are verified by `tsc --noEmit` + `expo export` bundling (behavioral logic is unit-tested in the pure tasks 2–5); this is stated explicitly, not hand-waved.

**Type consistency check:** `CoastState`, `Transaction`, `Income`, `BudgetPlan`, `Leak`, `Pence`, `SEED_STATE`, `serialize`/`deserialize`, `categoriesById`, `closeLeak`, `payCycle`/`spendRoom`/`cycleSummary`/`planBreakdown`/`annualLeakTotal`/`leaksClosedAnnual` are all real exports from the Plan-1 packages (verified against `@coast/core` and `@coast/engine` barrels). Font family strings in `tokens.ts` (`Archivo_700Bold`, `Archivo_800ExtraBold`, `Inter_400Regular`, `Inter_600SemiBold`) match the keys loaded in `fonts.ts`. Store action names (`hydrate`, `addTransaction`, `completeOnboarding`, `stampStatement`, `closeLeakById`, `reset`) are used identically in the store test (Task 4). `KeyValueStore`/`STORAGE_KEY`/`loadState`/`saveState` names match between persistence.ts and its test (Task 5). One open risk flagged inline: if `formatGBP`/engine result-type names differ from assumptions, use the actual barrel export (noted in Tasks 1 and 3).
```
