# Coast Screens B Implementation Plan (Payments · Profile · Weekly Statement)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the remaining three screens from the reference screenshots — Payments (recurring total + month calendar + upcoming billings), Profile (impact, leaks-closed, weekly-statement card, receipts), and the Weekly Statement flow (a statements list + a swipeable 4-page statement you can "stamp") — driven by the existing store/engine, plus the shared components and pure helpers they need.

**Architecture:** New pure helpers (`src/viz/calendar.ts` month grid, `src/store/payments.ts` billings, `src/store/statement.ts` statement-view selector, `src/viz/format.ts` additions) wrap engine/state into render-ready shapes, Jest-tested. New presentational components render from theme tokens. The Weekly Statement is reached from Profile via new expo-router stack routes (`app/statements/index.tsx` list, `app/statements/[id].tsx` paged viewer); "Stamp" calls the existing `stampStatement` store action. Screens stay thin.

**Tech Stack:** Expo + expo-router (stack routes outside the tab group), React Native, TypeScript strict, existing store/selectors + `@coast/engine` `weeklyStatement`/`leaksClosedAnnual`. Jest for pure helpers; `expo export` bundle + `tsc --noEmit` + iOS Simulator for RN.

## Global Constraints

- **Reuse, don't rebuild:** finance/statement math from `@coast/engine` (`weeklyStatement`, `leaksClosedAnnual`, `payCycle`, `spendRoom`); state from the store. Screens contain no finance logic.
- **Money only via `Money`** (`formatGBP`). Never format currency inline.
- **No hardcoded style values in components:** colors/spacing/radii/type via `tokens.ts`/`theme.ts`. Category/segment colors via `theme.categoryColors`. (Brief-authored intrinsic literals like a cell size are allowed.)
- **Determinism:** pure helpers use UTC date math and take inputs; no `Date.now()`/argless `new Date()` in `src/viz/**` or `src/store/**`. Screens pass real `new Date()` at the edge.
- **Native deps via `npx expo install`.** TS strict. Root `npm test` and `cd apps/mobile && npx tsc --noEmit` stay clean. RN tasks verified by `tsc --noEmit` + `expo export`; pure tasks are Jest TDD.
- **Reference values (seed + ref `2026-08-09T12:00:00Z`):** recurring total 152000 (£1,520); leaks-closed 0; member since `2026-08-01` → "Aug 2026"; profile name "Snigdha"; statement W31 (`stmt_w31`, issue 31, weekStart `2026-07-27`, `readyToStamp`) renders the quiet week — actualSpend 0, movedForward 0, result 0, nextDailyLine 900 (£9); August billings on days 1, 5, 15, 20.

## Scope note

This plan = **Payments, Profile, Weekly Statement**. Home/Activity/Plan shipped in Plan 3. Onboarding/quick-add/CSV/Shortcut = Plan 4; polish = Plan 5. Data-entry actions here are stubs: Payments "+ Add payment" and Profile "Settings" are `Alert` stubs (real forms land in Plan 4). Also fold in the Plan-3 carried-forward cosmetic minors (see Task 2/Task 4 notes): add a `coral` theme token for the off-pace StatusDots, and dedupe the Home "left until payday" line.

## File structure

```
apps/mobile/
  src/
    viz/
      calendar.ts          # monthGrid()                       (pure)
      format.ts            # + memberSinceLabel()              (pure, extend)
    store/
      payments.ts          # billingsForMonth/upcomingBillings (pure)
      statement.ts         # selectStatementView, selectStatementList (pure)
    design/
      primitives/
        Avatar.tsx
        StatCol.tsx
        HeaderPill.tsx
      MonthCalendar.tsx
      StatementCard.tsx
      StatementPages.tsx    # Cover/Ledger/Movements/Stamp pages
    __tests__/
      calendar.test.ts
      payments.test.ts
      statement.test.ts
  app/
    (tabs)/
      payments.tsx         # rewritten
      profile.tsx          # rewritten
    statements/
      index.tsx            # statements list
      [id].tsx             # paged statement viewer + stamp
```

---

## Task 1: Pure helpers (calendar grid, billings, statement view, member-since)

**Files:**
- Create: `apps/mobile/src/viz/calendar.ts`, `apps/mobile/src/store/payments.ts`, `apps/mobile/src/store/statement.ts`
- Modify: `apps/mobile/src/viz/format.ts` (add `memberSinceLabel`)
- Test: `apps/mobile/src/__tests__/calendar.test.ts`, `payments.test.ts`, `statement.test.ts`

**Interfaces:**
- `calendar.ts`: `interface MonthCell { day: number | null; iso?: string }`; `monthGrid(year: number, month0: number): MonthCell[]` (Monday-first, padded to whole weeks; blanks have `day: null`).
- `payments.ts`: `interface Billing { day: number; iso: string; payment: Payment }`; `billingsForMonth(payments: Payment[], year: number, month0: number): Billing[]` (sorted by day, `billingDay` clamped to month length); `upcomingBillings(payments, year, month0, fromDay: number): Billing[]`.
- `statement.ts`: `selectStatementView(state: CoastState, statement: Statement, now: Date): WeeklyStatementView`; `selectStatementList(state: CoastState): Statement[]`.
- `format.ts`: `memberSinceLabel(iso: string): string` → e.g. `"Aug 2026"`.

- [ ] **Step 1: Write the failing tests**

`apps/mobile/src/__tests__/calendar.test.ts`:
```ts
import { monthGrid } from '../viz/calendar';

describe('monthGrid', () => {
  it('Jan 2024 starts on Monday with 31 day cells, padded to whole weeks', () => {
    const cells = monthGrid(2024, 0); // Jan 1 2024 was a Monday
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((c) => c.day !== null)).toHaveLength(31);
    expect(cells[0]).toEqual({ day: 1, iso: '2024-01-01' });
  });
  it('Feb 2026 has 28 day cells', () => {
    expect(monthGrid(2026, 1).filter((c) => c.day !== null)).toHaveLength(28);
  });
  it('leading blanks appear before day 1 when the month does not start on Monday', () => {
    const cells = monthGrid(2026, 7); // August 2026
    const firstDayIndex = cells.findIndex((c) => c.day === 1);
    expect(firstDayIndex).toBeGreaterThan(0);
    expect(cells.slice(0, firstDayIndex).every((c) => c.day === null)).toBe(true);
  });
});
```

`apps/mobile/src/__tests__/payments.test.ts`:
```ts
import { SEED_STATE } from '@coast/core';
import { billingsForMonth, upcomingBillings } from '../store/payments';

describe('billings', () => {
  it('sorts seed billings by day for August 2026', () => {
    const b = billingsForMonth(SEED_STATE.payments, 2026, 7);
    expect(b.map((x) => x.day)).toEqual([1, 5, 15, 20]);
    expect(b[0].iso).toBe('2026-08-01');
  });
  it('upcoming keeps only billings on/after a given day', () => {
    const up = upcomingBillings(SEED_STATE.payments, 2026, 7, 9);
    expect(up.map((x) => x.day)).toEqual([15, 20]);
  });
  it('clamps a day-31 billing into a short month', () => {
    const b = billingsForMonth([{ id: 'x', name: 'X', amount: 100, cadence: 'monthly', billingDay: 31, categoryId: 'rent' }], 2026, 1);
    expect(b[0].day).toBe(28);
  });
});
```

`apps/mobile/src/__tests__/statement.test.ts`:
```ts
import { SEED_STATE } from '@coast/core';
import { selectStatementView, selectStatementList } from '../store/statement';

const now = new Date('2026-08-09T12:00:00Z');

describe('statement selectors', () => {
  it('lists the seeded statements', () => {
    expect(selectStatementList(SEED_STATE).map((s) => s.id)).toEqual(['stmt_w31']);
  });
  it('builds the quiet W31 view (issue 31, next daily line £9, all zero)', () => {
    const view = selectStatementView(SEED_STATE, SEED_STATE.statements[0], now);
    expect(view.issueNumber).toBe(31);
    expect(view.weekStart).toBe('2026-07-27');
    expect(view.actualSpend).toBe(0);
    expect(view.movedForward).toBe(0);
    expect(view.result).toBe(0);
    expect(view.nextDailyLine).toBe(900);
    expect(view.dailyLedger).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest calendar payments statement`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the helpers**

`apps/mobile/src/viz/calendar.ts`:
```ts
export interface MonthCell {
  day: number | null;
  iso?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function monthGrid(year: number, month0: number): MonthCell[] {
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const firstDow = (new Date(Date.UTC(year, month0, 1)).getUTCDay() + 6) % 7; // Monday = 0
  const cells: MonthCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: `${year}-${pad(month0 + 1)}-${pad(d)}` });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
}
```

`apps/mobile/src/store/payments.ts`:
```ts
import { Payment } from '@coast/core';

export interface Billing {
  day: number;
  iso: string;
  payment: Payment;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function billingsForMonth(payments: Payment[], year: number, month0: number): Billing[] {
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  return payments
    .map((payment) => {
      const day = Math.min(payment.billingDay, lastDay);
      return { day, iso: `${year}-${pad(month0 + 1)}-${pad(day)}`, payment };
    })
    .sort((a, b) => a.day - b.day);
}

export function upcomingBillings(payments: Payment[], year: number, month0: number, fromDay: number): Billing[] {
  return billingsForMonth(payments, year, month0).filter((b) => b.day >= fromDay);
}
```

`apps/mobile/src/store/statement.ts`:
```ts
import { CoastState, Statement, categoriesById } from '@coast/core';
import { payCycle, spendRoom, weeklyStatement, WeeklyStatementView } from '@coast/engine';

export function selectStatementList(state: CoastState): Statement[] {
  return state.statements;
}

export function selectStatementView(state: CoastState, statement: Statement, now: Date): WeeklyStatementView {
  const cats = categoriesById(state.categories);
  const cycle = payCycle(state.income.paydayDom, now);
  const room = spendRoom(state.plan, state.transactions, cats, cycle, now);
  const weekStart = new Date(`${statement.weekStart}T00:00:00Z`);
  const memberSince = Date.parse(`${state.memberSince}T00:00:00Z`);
  // Weeks before membership had no daily line (pre-plan); otherwise a whole-week line.
  const weeklyLine = weekStart.getTime() < memberSince ? 0 : room.dailyRoom * 7;
  return weeklyStatement({
    issueNumber: statement.issueNumber,
    weekStart,
    transactions: state.transactions,
    categoriesById: cats,
    weeklyLine,
    currentDailyRoom: room.dailyRoom,
    leaksSpotted: 0,
  });
}
```

Append to `apps/mobile/src/viz/format.ts`:
```ts
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function memberSinceLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest calendar payments statement format`
Expected: PASS. Then `npm test` (full suite) stays green + pristine.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/viz/calendar.ts apps/mobile/src/viz/format.ts apps/mobile/src/store/payments.ts apps/mobile/src/store/statement.ts apps/mobile/src/__tests__/calendar.test.ts apps/mobile/src/__tests__/payments.test.ts apps/mobile/src/__tests__/statement.test.ts
git commit -m "feat(mobile): calendar/billings/statement-view/member-since helpers"
```

---

## Task 2: Shared components (Avatar, StatCol, HeaderPill) + coral token + Home dedupe

**Files:**
- Create: `apps/mobile/src/design/primitives/Avatar.tsx`, `StatCol.tsx`, `HeaderPill.tsx`
- Modify: `apps/mobile/src/design/tokens.ts` + `theme.ts` (add `coral`/`overPace`); `apps/mobile/src/design/primitives/StatusDots.tsx` (use it); `apps/mobile/app/(tabs)/index.tsx` (remove the duplicated "left until payday" line)
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- `<Avatar initial size?>` — filled accent circle with a centered uppercase initial.
- `<StatCol label value valueColor?>` — small uppercase label above a stat-size value.
- `<HeaderPill label onPress icon?>` — a rounded card-colored pill (used for "Settings").

- [ ] **Step 1: Add the coral token + fix StatusDots + dedupe Home**

In `apps/mobile/src/design/tokens.ts` `colors`, add: `overPace: '#E4694E',`. In `theme.ts`, add `overPace: colors.overPace,`. In `StatusDots.tsx`, change the off-pace color from `theme.categoryColors.debt` to `theme.overPace`. In `apps/mobile/app/(tabs)/index.tsx`, remove the second occurrence of the `{formatGBP(room.leftUntilPayday)} left until payday` line (keep the one under the spend-room hero; the "UNTIL PAYDAY" block keeps only the "N days left" title).

- [ ] **Step 2: Implement the components**

`apps/mobile/src/design/primitives/Avatar.tsx`:
```tsx
import { View } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function Avatar({ initial, size = 96 }: { initial: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: theme.radius.pill, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="title" style={{ color: theme.onDark }}>{initial.slice(0, 1).toUpperCase()}</AppText>
    </View>
  );
}
```

`apps/mobile/src/design/primitives/StatCol.tsx`:
```tsx
import { View } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function StatCol({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View>
      <AppText variant="label" muted>{label}</AppText>
      <AppText variant="stat" style={{ color: valueColor ?? theme.text, marginTop: theme.space.xs }}>{value}</AppText>
    </View>
  );
}
```

`apps/mobile/src/design/primitives/HeaderPill.tsx`:
```tsx
import { Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function HeaderPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: theme.card, borderRadius: theme.radius.pill, paddingVertical: theme.space.sm, paddingHorizontal: theme.space.lg }}
    >
      <AppText variant="label">{label}</AppText>
    </Pressable>
  );
}
```

- [ ] **Step 3: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds. Root `npm test` stays green.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/design/primitives/Avatar.tsx apps/mobile/src/design/primitives/StatCol.tsx apps/mobile/src/design/primitives/HeaderPill.tsx apps/mobile/src/design/tokens.ts apps/mobile/src/design/theme.ts apps/mobile/src/design/primitives/StatusDots.tsx "apps/mobile/app/(tabs)/index.tsx"
git commit -m "feat(mobile): Avatar/StatCol/HeaderPill + coral off-pace token + Home dedupe"
```

---

## Task 3: MonthCalendar component

**Files:**
- Create: `apps/mobile/src/design/MonthCalendar.tsx`
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- Consumes: `monthGrid` from `../viz/calendar`, `theme`.
- Produces: `<MonthCalendar year month0 todayIso? markedIsos? >` — Mon–Sun weekday header, a 7-column grid of day cells; `todayIso` gets a ring, each `markedIsos` day gets a small accent dot under the number.

- [ ] **Step 1: Implement the calendar**

`apps/mobile/src/design/MonthCalendar.tsx`:
```tsx
import { View } from 'react-native';
import { monthGrid } from '../viz/calendar';
import { AppText } from './primitives/Text';
import { theme } from './theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthCalendar({
  year, month0, todayIso, markedIsos = [],
}: { year: number; month0: number; todayIso?: string; markedIsos?: string[] }) {
  const cells = monthGrid(year, month0);
  const marked = new Set(markedIsos);
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: theme.space.sm }}>
            <AppText variant="label" muted>{w}</AppText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((c, i) => {
          const isToday = c.iso != null && c.iso === todayIso;
          const isMarked = c.iso != null && marked.has(c.iso);
          return (
            <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              {c.day != null ? (
                <View style={{ width: 36, height: 36, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: isToday ? 2 : 0, borderColor: theme.text }}>
                  <AppText variant="body">{c.day}</AppText>
                  {isMarked ? (
                    <View style={{ position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: theme.radius.pill, backgroundColor: theme.accent }} />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds. Root `npm test` stays green.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/design/MonthCalendar.tsx
git commit -m "feat(mobile): MonthCalendar (grid, today ring, billing markers)"
```

---

## Task 4: Payments screen

**Files:**
- Modify (rewrite): `apps/mobile/app/(tabs)/payments.tsx`
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- Consumes: `useCoastStore`, `selectRecurringTotal` (from `selectors.ts`), `billingsForMonth`/`upcomingBillings` (from `store/payments.ts`), `MonthCalendar`, primitives (`Screen`, `AppText`, `Money`, `PillButton`), `formatGBP`, `theme`. Local `Alert` stub for "Add payment".

- [ ] **Step 1: Rewrite Payments**

`apps/mobile/app/(tabs)/payments.tsx`:
```tsx
import { Alert, ScrollView, View } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectRecurringTotal } from '../../src/store/selectors';
import { billingsForMonth, upcomingBillings } from '../../src/store/payments';
import { MonthCalendar } from '../../src/design/MonthCalendar';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { PillButton } from '../../src/design/primitives/PillButton';
import { formatGBP } from '@coast/core';
import { theme } from '../../src/design/theme';

export default function Payments() {
  const data = useCoastStore((s) => s.data);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month0 = now.getUTCMonth();
  const total = selectRecurringTotal(data);
  const billings = billingsForMonth(data.payments, year, month0);
  const upcoming = upcomingBillings(data.payments, year, month0, now.getUTCDate());
  const todayIso = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <AppText variant="label" muted style={{ marginTop: theme.space.lg }}>PAYMENTS</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm }}>
          <Money pence={total} variant="hero" />
          <AppText variant="title">/mo</AppText>
        </View>
        <AppText variant="body" muted>{formatGBP(total)} protected · {formatGBP(0)} possible savings</AppText>

        <View style={{ marginTop: theme.space.lg }}>
          <PillButton label="+ ADD PAYMENT" onPress={() => Alert.alert('Add payment', 'Adding payments arrives in the next update.')} />
        </View>

        <View style={{ marginTop: theme.space.xl }}>
          <MonthCalendar year={year} month0={month0} todayIso={todayIso} markedIsos={billings.map((b) => b.iso)} />
        </View>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>UPCOMING BILLINGS</AppText>
        {upcoming.length === 0 ? (
          <AppText variant="body" muted>Nothing left to bill this month.</AppText>
        ) : (
          upcoming.map((b) => (
            <View key={b.payment.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
              <AppText variant="body">{b.payment.name}</AppText>
              <View style={{ flexDirection: 'row', gap: theme.space.md }}>
                <AppText variant="body" muted>day {b.day}</AppText>
                <Money pence={b.payment.amount} variant="body" />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds. Root `npm test` stays green.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/app/(tabs)/payments.tsx"
git commit -m "feat(mobile): real Payments screen (recurring total, calendar, upcoming billings)"
```

---

## Task 5: StatementCard + Profile screen

**Files:**
- Create: `apps/mobile/src/design/StatementCard.tsx`
- Modify (rewrite): `apps/mobile/app/(tabs)/profile.tsx`
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- `<StatementCard statement onOpen onAll>` — cream card: "WEEKLY STATEMENT" + a "NEW" badge, "W{issueNumber} is ready", "4 pages · ready to read", and "Open W{n}" / "All statements" pressables.
- Profile consumes: `useCoastStore`, `selectLeaksClosedAnnual` (add to `selectors.ts` if missing — it wraps engine `leaksClosedAnnual`; confirm it exists, else add), `memberSinceLabel`, `Avatar`, `StatCol`, `HeaderPill`, `StatementCard`, primitives, `formatGBP`, `theme`, and `useRouter` from `expo-router` to navigate to `/statements` and `/statements/[id]`.

- [ ] **Step 1: Ensure `selectLeaksClosedAnnual` exists**

Check `apps/mobile/src/store/selectors.ts` — it already exports `selectLeaksClosedAnnual` (added in Plan 2). If not present, add:
```ts
export function selectLeaksClosedAnnual(state: CoastState): Pence {
  return leaksClosedAnnual(state.leaks);
}
```
(with `leaksClosedAnnual` imported from `@coast/engine`).

- [ ] **Step 2: Implement StatementCard**

`apps/mobile/src/design/StatementCard.tsx`:
```tsx
import { View, Pressable } from 'react-native';
import { Statement } from '@coast/core';
import { Card } from './primitives/Card';
import { AppText } from './primitives/Text';
import { theme } from './theme';

export function StatementCard({ statement, onOpen, onAll }: { statement: Statement; onOpen: () => void; onAll: () => void }) {
  const isNew = statement.status === 'readyToStamp';
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="label" style={{ color: theme.accent }}>WEEKLY STATEMENT</AppText>
        {isNew ? (
          <View style={{ backgroundColor: theme.accent, borderRadius: theme.radius.pill, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.md }}>
            <AppText variant="label" style={{ color: theme.onDark }}>NEW</AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="title" style={{ marginTop: theme.space.md }}>W{statement.issueNumber} is ready</AppText>
      <AppText variant="body" muted>4 pages · ready to read</AppText>
      <View style={{ flexDirection: 'row', gap: theme.space.xl, marginTop: theme.space.lg }}>
        <Pressable onPress={onOpen}><AppText variant="label" style={{ color: theme.accent }}>Open W{statement.issueNumber}</AppText></Pressable>
        <Pressable onPress={onAll}><AppText variant="label">All statements</AppText></Pressable>
      </View>
    </Card>
  );
}
```

- [ ] **Step 3: Rewrite Profile**

`apps/mobile/app/(tabs)/profile.tsx`:
```tsx
import { Alert, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCoastStore } from '../../src/store/store';
import { selectLeaksClosedAnnual } from '../../src/store/selectors';
import { memberSinceLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Avatar } from '../../src/design/primitives/Avatar';
import { StatCol } from '../../src/design/primitives/StatCol';
import { HeaderPill } from '../../src/design/primitives/HeaderPill';
import { StatementCard } from '../../src/design/StatementCard';
import { formatGBP } from '@coast/core';
import { theme } from '../../src/design/theme';

export default function Profile() {
  const data = useCoastStore((s) => s.data);
  const router = useRouter();
  const latest = data.statements[0];
  const closed = selectLeaksClosedAnnual(data);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <HeaderPill label="Settings" onPress={() => Alert.alert('Settings', 'Settings arrive in a later update.')} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.lg, marginTop: theme.space.xl }}>
          <Avatar initial={data.profileName} />
          <View>
            <AppText variant="title">{data.profileName}</AppText>
            <AppText variant="body" muted>Spending less</AppText>
          </View>
        </View>

        <View style={{ marginTop: theme.space.xl }}>
          <StatCol label="ONGOING IMPACT" value={`+${formatGBP(closed)}/yr`} valueColor={theme.categoryColors.savings} />
        </View>

        <View style={{ flexDirection: 'row', gap: theme.space.xxl, marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
          <StatCol label="LEAKS CLOSED" value={`${formatGBP(closed)}/yr`} />
          <StatCol label="MEMBER SINCE" value={memberSinceLabel(data.memberSince)} />
        </View>

        {latest ? (
          <View style={{ marginTop: theme.space.xl }}>
            <StatementCard
              statement={latest}
              onOpen={() => router.push(`/statements/${latest.id}`)}
              onAll={() => router.push('/statements')}
            />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.xl }}>
          <AppText variant="label" muted>LATEST RECEIPT · {data.funds.length} SAVED</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>See all</AppText>
        </View>
        <AppText variant="body" muted style={{ marginTop: theme.space.md }}>Your first receipt prints when a fund hits its goal.</AppText>
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 4: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds. Root `npm test` stays green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/design/StatementCard.tsx "apps/mobile/app/(tabs)/profile.tsx" apps/mobile/src/store/selectors.ts
git commit -m "feat(mobile): real Profile screen + StatementCard"
```

---

## Task 6: StatementPages component (the 4 pages)

**Files:**
- Create: `apps/mobile/src/design/StatementPages.tsx`
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- Consumes: `WeeklyStatementView` from `@coast/engine`, primitives (`Card`, `AppText`, `Money`), `PillButton`, `theme`.
- Produces four exported page components, each taking `{ view: WeeklyStatementView }` (Stamp also takes `{ onStamp, stamped }`): `StatementCover`, `StatementLedger`, `StatementMovements`, `StatementStamp`. Each renders as a full-width cream `Card` styled like the reference "WEEKLY INVOICE" pages (header `SPENDLINE`→`COAST` wordmark + `WEEKLY STATEMENT`, issue no. `SPL-W{n}-2026`, a red "READY TO STAMP"/"STAMPED" marker, the page's figures, and a "PAGE k OF 4 · NOT AN AMOUNT DUE" footer).

- [ ] **Step 1: Implement the pages**

`apps/mobile/src/design/StatementPages.tsx`:
```tsx
import { View } from 'react-native';
import { WeeklyStatementView } from '@coast/engine';
import { Card } from './primitives/Card';
import { AppText } from './primitives/Text';
import { Money } from './primitives/Money';
import { PillButton } from './primitives/PillButton';
import { theme } from './theme';

function Header({ view }: { view: WeeklyStatementView }) {
  return (
    <View style={{ borderBottomWidth: 2, borderBottomColor: theme.text, paddingBottom: theme.space.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="label" style={{ color: theme.accent }}>COAST</AppText>
        <AppText variant="label" muted>ISSUE {view.issueNumber}</AppText>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <AppText variant="title">WEEKLY STATEMENT</AppText>
        <AppText variant="label" muted>SPL-W{view.issueNumber}-2026</AppText>
      </View>
    </View>
  );
}

function Footer({ page }: { page: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.md, marginTop: theme.space.lg }}>
      <AppText variant="label" muted>NOT AN AMOUNT DUE</AppText>
      <AppText variant="label" muted>PAGE {page} OF 4</AppText>
    </View>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
      <AppText variant="label" muted>{label}</AppText>
      {children}
    </View>
  );
}

export function StatementCover({ view, stamped }: { view: WeeklyStatementView; stamped: boolean }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 01</AppText>
      <View style={{ marginTop: theme.space.md, alignSelf: 'flex-start', borderWidth: 2, borderColor: theme.accent, borderRadius: theme.radius.pill, paddingVertical: theme.space.sm, paddingHorizontal: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>{stamped ? 'STAMPED' : 'READY TO STAMP'}</AppText>
      </View>
      <View style={{ marginTop: theme.space.lg }}>
        <Line label="DAYS UNDER SPENDLINE"><AppText variant="title">{view.daysUnder} / {view.daysScored}</AppText></Line>
        <Line label="PLANNED SPEND"><Money pence={view.plannedSpend} variant="title" mode="exact" /></Line>
        <Line label="ACTUAL SPEND"><Money pence={view.actualSpend} variant="title" mode="exact" /></Line>
        <Line label="LEAKS SPOTTED"><Money pence={view.leaksSpotted} variant="title" mode="exact" /></Line>
        <Line label="MONEY MOVED FORWARD"><Money pence={view.movedForward} variant="title" mode="exact" /></Line>
      </View>
      <Footer page={1} />
    </Card>
  );
}

export function StatementLedger({ view }: { view: WeeklyStatementView }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 02</AppText>
      <AppText variant="title" style={{ marginTop: theme.space.sm }}>Daily ledger</AppText>
      <View style={{ marginTop: theme.space.md }}>
        {view.dailyLedger.map((d) => (
          <View key={d.day} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
            <AppText variant="body">{d.day}</AppText>
            <AppText variant="body" muted>{d.scored ? '' : 'NO ENTRY'}</AppText>
            <Money pence={d.amount} variant="body" mode="exact" />
          </View>
        ))}
      </View>
      <Line label="WEEKLY LINE"><Money pence={view.weeklyLine} variant="title" mode="exact" /></Line>
      <Line label="WEEKLY SPEND"><Money pence={view.weeklySpend} variant="title" mode="exact" /></Line>
      <Footer page={2} />
    </Card>
  );
}

export function StatementMovements({ view }: { view: WeeklyStatementView }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 03</AppText>
      <AppText variant="title" style={{ marginTop: theme.space.sm }}>Money movements</AppText>
      <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>
        {view.movedForward === 0 ? 'A quiet week. No envelope or savings movements were recorded.' : 'Savings moved forward this week.'}
      </AppText>
      <Line label="MOVED FORWARD"><Money pence={view.movedForward} variant="title" mode="exact" /></Line>
      <Footer page={3} />
    </Card>
  );
}

export function StatementStamp({ view, onStamp, stamped }: { view: WeeklyStatementView; onStamp: () => void; stamped: boolean }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 04</AppText>
      <AppText variant="title" style={{ marginTop: theme.space.sm }}>Stamp your week.</AppText>
      <View style={{ marginTop: theme.space.md }}>
        <Line label="RESULT"><Money pence={view.result} variant="title" mode="exact" /></Line>
        <Line label="NEXT DAILY SPENDLINE"><Money pence={view.nextDailyLine} variant="title" /></Line>
        <Line label="CARRY IN / OUT"><Money pence={view.carry} variant="title" mode="exact" /></Line>
      </View>
      <View style={{ marginTop: theme.space.xl }}>
        <PillButton label={stamped ? 'STAMPED' : 'STAMP THIS STATEMENT'} onPress={stamped ? () => {} : onStamp} />
      </View>
      <Footer page={4} />
    </Card>
  );
}
```

- [ ] **Step 2: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds. Root `npm test` stays green.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/design/StatementPages.tsx
git commit -m "feat(mobile): Weekly Statement pages (cover, ledger, movements, stamp)"
```

---

## Task 7: Statements list + paged viewer routes (with stamp wiring)

**Files:**
- Create: `apps/mobile/app/statements/index.tsx`, `apps/mobile/app/statements/[id].tsx`
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- `statements/index.tsx` — a `Screen` listing `data.statements` (each: "W{n} is ready" / status), tapping one routes to `/statements/{id}`; a back affordance via the stack header or a top row.
- `statements/[id].tsx` — reads `id` via `useLocalSearchParams`, finds the statement, builds the view via `selectStatementView(data, statement, new Date())`, renders the 4 pages in a horizontal `ScrollView` with `pagingEnabled`, shows page dots, and wires `StatementStamp.onStamp` to `useCoastStore((s) => s.stampStatement)(id)`. `stamped` = statement.status === 'stamped'.

- [ ] **Step 1: Implement the statements list**

`apps/mobile/app/statements/index.tsx`:
```tsx
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCoastStore } from '../../src/store/store';
import { selectStatementList } from '../../src/store/statement';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { theme } from '../../src/design/theme';

export default function StatementsList() {
  const data = useCoastStore((s) => s.data);
  const router = useRouter();
  const statements = selectStatementList(data);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginTop: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>‹ Back</AppText>
      </Pressable>
      <AppText variant="title" style={{ marginTop: theme.space.md }}>Statements</AppText>
      <ScrollView style={{ marginTop: theme.space.lg }} showsVerticalScrollIndicator={false}>
        {statements.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/statements/${s.id}`)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.line }}
          >
            <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>W{s.issueNumber} is ready</AppText>
            <AppText variant="label" muted>{s.status === 'stamped' ? 'STAMPED' : 'READY'}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 2: Implement the paged viewer**

`apps/mobile/app/statements/[id].tsx`:
```tsx
import { useState } from 'react';
import { Dimensions, ScrollView, View, Pressable, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCoastStore } from '../../src/store/store';
import { selectStatementView } from '../../src/store/statement';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { StatementCover, StatementLedger, StatementMovements, StatementStamp } from '../../src/design/StatementPages';
import { theme } from '../../src/design/theme';

export default function StatementViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useCoastStore((s) => s.data);
  const stampStatement = useCoastStore((s) => s.stampStatement);
  const router = useRouter();
  const [page, setPage] = useState(0);
  const width = Dimensions.get('window').width - theme.space.xl * 2;

  const statement = data.statements.find((s) => s.id === id);
  if (!statement) {
    return (
      <Screen>
        <AppText variant="title" style={{ marginTop: theme.space.xl }}>Statement not found.</AppText>
      </Screen>
    );
  }
  const view = selectStatementView(data, statement, new Date());
  const stamped = statement.status === 'stamped';

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const pages = [
    <StatementCover key="1" view={view} stamped={stamped} />,
    <StatementLedger key="2" view={view} />,
    <StatementMovements key="3" view={view} />,
    <StatementStamp key="4" view={view} stamped={stamped} onStamp={() => stampStatement(statement.id)} />,
  ];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <Pressable onPress={() => router.back()}><AppText variant="label" style={{ color: theme.accent }}>‹ Invoices</AppText></Pressable>
        <AppText variant="label" style={{ color: theme.accent }}>W{view.issueNumber}</AppText>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ marginTop: theme.space.lg }}
      >
        {pages.map((p, i) => (
          <View key={i} style={{ width }}>{p}</View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.space.sm, marginTop: theme.space.lg }}>
        {pages.map((_, i) => (
          <View key={i} style={{ width: i === page ? 20 : 8, height: 8, borderRadius: theme.radius.pill, backgroundColor: i === page ? theme.text : theme.line }} />
        ))}
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds (the `statements/` routes register). Root `npm test` stays green.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/statements
git commit -m "feat(mobile): statements list + swipeable statement viewer with stamp"
```

---

## Post-plan acceptance (controller, not a subagent task)

After Task 7, the controller launches the app in the iOS Simulator (or documents deferral) and confirms: Payments shows "£1,520 /mo", the August calendar with today ringed and dots on days 1/5/15/20, and the upcoming-billings list; Profile shows the avatar + "Snigdha", "+£0/yr" ongoing impact, "MEMBER SINCE Aug 2026", and the "W31 is ready" card; tapping "Open W31" opens the paged statement (Cover shows "READY TO STAMP" + "NEXT DAILY SPENDLINE £9" on page 4), swiping pages moves the dots, and "Stamp this statement" flips the marker to STAMPED. If no simulator is available, the `expo export` bundle + `tsc` + Jest suites stand as automated acceptance, deferred to the user's machine.

## Self-Review

**Spec coverage (design spec §7 Payments/Profile/Statements slice + screenshots):**
- Payments (recurring total, calendar, upcoming) → Task 4 (+ calendar/billings helpers T1, MonthCalendar T3).
- Profile (impact, leaks-closed, member-since, statement card, receipts) → Task 5 (+ Avatar/StatCol/HeaderPill T2, StatementCard T5, memberSince T1).
- Weekly Statement (list + paged + stamp) → Tasks 6–7 (+ statement-view selector T1). Reuses engine `weeklyStatement`.
- Carried-forward Plan-3 minors (coral off-pace, Home dedupe) → Task 2.
- Onboarding/quick-add/CSV/Shortcut → Plan 4; Add-payment/Settings are Alert stubs here.

**Placeholder scan:** No TBD/TODO. Pure helpers (T1) are TDD; RN tasks verified by `tsc` + `expo export`; the Add-payment/Settings stubs are intentional and documented.

**Type consistency check:** `weeklyStatement`/`WeeklyStatementView`, `leaksClosedAnnual`, `payCycle`, `spendRoom` are real `@coast/engine` exports; `WeeklyStatementView` fields used (`issueNumber`, `weekStart`, `daysUnder`, `daysScored`, `plannedSpend`, `actualSpend`, `leaksSpotted`, `movedForward`, `weeklyLine`, `weeklySpend`, `dailyLedger[].{day,scored,amount}`, `result`, `nextDailyLine`, `carry`) match `packages/engine/src/weeklyStatement.ts`. `Statement`/`Payment`/`CoastState`/`categoriesById` from `@coast/core`. Store action `stampStatement(id)` and `selectRecurringTotal`/`selectLeaksClosedAnnual` exist from Plan 2 (Task 5 verifies the latter, adding it if absent). `Money` accepts `mode` (`'auto'|'exact'|'whole'`). Route paths `/statements` and `/statements/${id}` match the new files under `app/statements/`.
```
