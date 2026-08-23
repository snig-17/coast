# Coast Core Screens Implementation Plan (Home · Activity · Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three daily-driver placeholder tab screens (Home, Activity, Plan) with the real UIs from the reference screenshots, driven entirely by the existing store/selectors, plus the shared visual components and pure geometry/format helpers they need.

**Architecture:** New pure helpers (`src/viz/geometry.ts`, `src/viz/format.ts`, `src/store/cycleNav.ts`) wrap engine data into render-ready shapes and are unit-tested with Jest. New presentational components (`src/design/primitives/*`, `src/design/DonutChart.tsx`) render from theme tokens only. The three screens compose selectors + components and stay thin (no finance math inline). Cycle navigation on Activity is local component state over a pure `cycleAtOffset` helper.

**Tech Stack:** Expo + expo-router, React Native, TypeScript strict, `react-native-svg` (new, for the donut), Zustand store + selectors from Plan 2, `@coast/engine`/`@coast/core`. Jest (node/ts-jest) for pure helpers; `expo export` bundle + `tsc --noEmit` + iOS Simulator for the RN screens.

## Global Constraints

- **Reuse, don't rebuild:** all finance math from `@coast/engine`; state from the Zustand store + selectors. Screens contain no finance logic.
- **Money only via `Money`** (`formatGBP`). Never format currency inline.
- **No hardcoded style values in components:** colors/spacing/radii/type via `src/design/tokens.ts` / `theme.ts`. Category colors come from `theme.categoryColors` (bills→ink, savings→green, debt→amber, discretionary→teal).
- **Determinism:** pure helpers use UTC date math and take inputs (`now: Date`, `cycle`, etc.); no `Date.now()`/argless `new Date()` in `src/viz/**` or `src/store/**`. Screens pass the real `new Date()` at the edge (matches Plan 2).
- **Native deps via `npx expo install`** (SDK-compatible). Do NOT hand-pin.
- **TS strict.** Root `npm test` and app `cd apps/mobile && npx tsc --noEmit` must both stay clean. RN component tasks are verified by `tsc --noEmit` + `npx expo export --platform ios` (no jest); pure tasks are TDD with Jest.
- **Reference values (seed + ref `2026-08-09T12:00:00Z`):** spend room dailyRoom 813 (£8.13), leftUntilPayday 17886 (£178.86), daysUntilPayday 22, cycle `2026-07-31 → 2026-08-30` label "31 Jul — 30 Aug 2026", plan total 206500 (£2,065) with bills 152000/savings 8500/debt 0/discretionary 46000.

## Scope note

This plan = **Home, Activity, Plan** only. **Payments (calendar), Profile, and the Weekly Statement** are Plan 3b. Onboarding, quick-add, CSV import, and the iOS-Shortcut intake are Plan 4. The Home `+` FAB is present but its press is a documented stub (a small "coming soon" alert) until Plan 4 builds quick-add.

## File structure

```
apps/mobile/
  src/
    viz/
      geometry.ts          # donutStrokes()                     (pure)
      format.ts            # cycleLabel/weekdayLabel/monthLabel/paceLabel (pure)
    store/
      cycleNav.ts          # cycleAtOffset + offset selectors    (pure)
    design/
      primitives/
        SectionHeader.tsx
        ProgressBar.tsx
        Fab.tsx
        StatusDots.tsx
        PaydayDots.tsx
        CategoryRow.tsx
        SegmentedToggle.tsx
        InfoCard.tsx
      DonutChart.tsx        # react-native-svg
    __tests__/
      geometry.test.ts
      format.test.ts
      cycleNav.test.ts
  app/(tabs)/
    index.tsx              # Home (rewritten)
    activity.tsx           # Activity (rewritten)
    plan.tsx               # Plan (rewritten)
```

---

## Task 1: Install react-native-svg + pure viz/format/cycle-nav helpers

**Files:**
- Create: `apps/mobile/src/viz/geometry.ts`, `apps/mobile/src/viz/format.ts`, `apps/mobile/src/store/cycleNav.ts`
- Test: `apps/mobile/src/__tests__/geometry.test.ts`, `format.test.ts`, `cycleNav.test.ts`
- Modify: `apps/mobile/package.json` (adds `react-native-svg` via expo install)

**Interfaces:**
- Produces (`geometry.ts`): `interface DonutStroke { group: PlanSegment['group']; length: number; offset: number }`; `donutStrokes(segments: PlanSegment[], radius: number): DonutStroke[]`.
- Produces (`format.ts`): `cycleLabel(cycle: PayCycle): string`; `weekdayLabel(now: Date): string`; `monthLabel(now: Date): string`; `interface Pace { onPace: boolean; text: string }`; `paceLabel(room: SpendRoom): Pace`.
- Produces (`cycleNav.ts`): `cycleAtOffset(paydayDom: number, now: Date, offset: number): PayCycle`; `selectPayCycleAtOffset(state, now, offset): PayCycle`; `selectCycleSummaryAtOffset(state, now, offset): CycleSummary`; `selectCycleTransactions(state, now, offset): Transaction[]`.

- [ ] **Step 1: Install react-native-svg**

```bash
cd apps/mobile && npx expo install react-native-svg
```
Then run `npm install` at the repo root so the lockfile updates. (No code imports it yet — that's Task 3.)

- [ ] **Step 2: Write the failing tests**

`apps/mobile/src/__tests__/geometry.test.ts`:
```ts
import { SEED_STATE } from '@coast/core';
import { planBreakdown } from '@coast/engine';
import { donutStrokes } from '../viz/geometry';

describe('donutStrokes', () => {
  const b = planBreakdown(SEED_STATE.plan);
  const r = 100;
  const C = 2 * Math.PI * r;

  it('lengths are proportional to each segment pct and offsets accumulate', () => {
    const strokes = donutStrokes(b.segments, r);
    expect(strokes).toHaveLength(4);
    expect(strokes[0].offset).toBe(0);
    // bills is first: length = pct * circumference
    expect(strokes[0].length).toBeCloseTo((152000 / 206500) * C, 6);
    // second offset equals first length
    expect(strokes[1].offset).toBeCloseTo(strokes[0].length, 6);
    // total length ~= full circumference (debt is 0-length)
    const total = strokes.reduce((s, x) => s + x.length, 0);
    expect(total).toBeCloseTo(C, 6);
  });

  it('is safe for an all-zero plan', () => {
    const strokes = donutStrokes(
      planBreakdown({ bills: 0, savings: 0, debt: 0, discretionary: 0, essentials: 0, lifestyle: 0, joy: 0 }).segments,
      r,
    );
    expect(strokes.every((s) => s.length === 0)).toBe(true);
  });
});
```

`apps/mobile/src/__tests__/format.test.ts`:
```ts
import { payCycle, spendRoom, SpendRoom } from '@coast/engine';
import { SEED_STATE, categoriesById } from '@coast/core';
import { cycleLabel, weekdayLabel, monthLabel, paceLabel } from '../viz/format';

const ref = new Date('2026-08-09T12:00:00Z');
const cycle = payCycle(31, ref);

describe('format helpers', () => {
  it('labels the pay cycle as start — displayEnd year', () => {
    expect(cycleLabel(cycle)).toBe('31 Jul — 30 Aug 2026');
  });
  it('names the weekday in caps (UTC)', () => {
    expect(weekdayLabel(new Date('1970-01-04T00:00:00Z'))).toBe('SUNDAY');
    expect(weekdayLabel(new Date('1970-01-05T00:00:00Z'))).toBe('MONDAY');
  });
  it('names the month in caps', () => {
    expect(monthLabel(ref)).toBe('AUGUST');
  });
  it('reports pace from spend room', () => {
    const room: SpendRoom = spendRoom(SEED_STATE.plan, [], categoriesById(SEED_STATE.categories), cycle, ref);
    expect(paceLabel(room)).toEqual({ onPace: true, text: "You're on pace." });
  });
});
```

`apps/mobile/src/__tests__/cycleNav.test.ts`:
```ts
import { SEED_STATE } from '@coast/core';
import { cycleAtOffset, selectCycleSummaryAtOffset } from '../store/cycleNav';

const ref = new Date('2026-08-09T12:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('cycleAtOffset', () => {
  it('offset 0 is the current cycle', () => {
    expect(iso(cycleAtOffset(31, ref, 0).start)).toBe('2026-07-31');
  });
  it('negative offset walks back a whole cycle', () => {
    expect(iso(cycleAtOffset(31, ref, -1).start)).toBe('2026-06-30');
  });
  it('positive offset walks forward a whole cycle', () => {
    expect(iso(cycleAtOffset(31, ref, 1).start)).toBe('2026-08-31');
  });
});

describe('selectCycleSummaryAtOffset', () => {
  it('an empty current cycle totals zero', () => {
    expect(selectCycleSummaryAtOffset(SEED_STATE, ref, 0).totalSpent).toBe(0);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest geometry format cycleNav`
Expected: FAIL — cannot find the modules.

- [ ] **Step 4: Implement the helpers**

`apps/mobile/src/viz/geometry.ts`:
```ts
import { PlanSegment } from '@coast/engine';

export interface DonutStroke {
  group: PlanSegment['group'];
  length: number;
  offset: number;
}

export function donutStrokes(segments: PlanSegment[], radius: number): DonutStroke[] {
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const out: DonutStroke[] = [];
  for (const s of segments) {
    const length = s.pct * circumference;
    out.push({ group: s.group, length, offset });
    offset += length;
  }
  return out;
}
```

`apps/mobile/src/viz/format.ts`:
```ts
import { PayCycle, SpendRoom } from '@coast/engine';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function cycleLabel(cycle: PayCycle): string {
  const s = cycle.start;
  const e = cycle.displayEnd;
  const start = `${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]}`;
  const end = `${e.getUTCDate()} ${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
  return `${start} — ${end}`;
}

export function weekdayLabel(now: Date): string {
  return DAYS[now.getUTCDay()];
}

export function monthLabel(now: Date): string {
  return MONTHS_FULL[now.getUTCMonth()];
}

export interface Pace {
  onPace: boolean;
  text: string;
}

export function paceLabel(room: SpendRoom): Pace {
  return room.onPace
    ? { onPace: true, text: "You're on pace." }
    : { onPace: false, text: 'Over today’s room.' };
}
```

`apps/mobile/src/store/cycleNav.ts`:
```ts
import { CoastState, Transaction, categoriesById } from '@coast/core';
import { payCycle, PayCycle, cycleSummary, CycleSummary } from '@coast/engine';

const MS_PER_DAY = 86_400_000;

export function cycleAtOffset(paydayDom: number, now: Date, offset: number): PayCycle {
  let cycle = payCycle(paydayDom, now);
  let remaining = offset;
  while (remaining < 0) {
    cycle = payCycle(paydayDom, new Date(cycle.start.getTime() - MS_PER_DAY));
    remaining += 1;
  }
  while (remaining > 0) {
    cycle = payCycle(paydayDom, new Date(cycle.nextPayday.getTime()));
    remaining -= 1;
  }
  return cycle;
}

export function selectPayCycleAtOffset(state: CoastState, now: Date, offset: number): PayCycle {
  return cycleAtOffset(state.income.paydayDom, now, offset);
}

export function selectCycleSummaryAtOffset(state: CoastState, now: Date, offset: number): CycleSummary {
  return cycleSummary(
    state.transactions,
    categoriesById(state.categories),
    state.plan,
    state.income,
    selectPayCycleAtOffset(state, now, offset),
  );
}

export function selectCycleTransactions(state: CoastState, now: Date, offset: number): Transaction[] {
  const cycle = selectPayCycleAtOffset(state, now, offset);
  const start = cycle.start.getTime();
  const end = cycle.nextPayday.getTime();
  return state.transactions.filter((t) => {
    const d = Date.parse(`${t.date}T00:00:00Z`);
    return d >= start && d < end;
  });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest geometry format cycleNav`
Expected: PASS. Then `npm test` (full suite) stays green + pristine.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/viz apps/mobile/src/store/cycleNav.ts apps/mobile/src/__tests__/geometry.test.ts apps/mobile/src/__tests__/format.test.ts apps/mobile/src/__tests__/cycleNav.test.ts apps/mobile/package.json package-lock.json
git commit -m "feat(mobile): viz geometry + format + cycle-nav helpers (+ react-native-svg)"
```

---

## Task 2: Presentational primitives (SectionHeader, ProgressBar, Fab, StatusDots, PaydayDots)

**Files:**
- Create: `apps/mobile/src/design/primitives/SectionHeader.tsx`, `ProgressBar.tsx`, `Fab.tsx`, `StatusDots.tsx`, `PaydayDots.tsx`
- Verify: `tsc --noEmit` + `expo export` (RN, no jest)

**Interfaces:**
- `<SectionHeader label right? onPressRight?>` — uppercase label left, optional right action.
- `<ProgressBar fraction color?>` — 0..1 clamped; track = theme.line, fill = color ?? theme.accent.
- `<Fab onPress>` — accent circular `+`, absolute bottom-right.
- `<StatusDots onPace>` — three dots, teal if onPace else coral.
- `<PaydayDots total elapsed>` — row of `min(total, 31)` dots, first `elapsed` filled ink, rest theme.line.

- [ ] **Step 1: Implement the components**

`apps/mobile/src/design/primitives/SectionHeader.tsx`:
```tsx
import { View, Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function SectionHeader({ label, right, onPressRight }: { label: string; right?: string; onPressRight?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.xl, marginBottom: theme.space.md }}>
      <AppText variant="label" muted>{label}</AppText>
      {right ? (
        <Pressable onPress={onPressRight}>
          <AppText variant="label" style={{ color: theme.accent }}>{right}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
```

`apps/mobile/src/design/primitives/ProgressBar.tsx`:
```tsx
import { View } from 'react-native';
import { theme } from '../theme';

export function ProgressBar({ fraction, color }: { fraction: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, fraction));
  return (
    <View style={{ height: 6, borderRadius: theme.radius.pill, backgroundColor: theme.line, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? theme.accent, borderRadius: theme.radius.pill }} />
    </View>
  );
}
```

`apps/mobile/src/design/primitives/Fab.tsx`:
```tsx
import { Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        right: theme.space.xl,
        bottom: theme.space.xl,
        width: 60,
        height: 60,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="title" style={{ color: theme.onDark }}>+</AppText>
    </Pressable>
  );
}
```

`apps/mobile/src/design/primitives/StatusDots.tsx`:
```tsx
import { View } from 'react-native';
import { theme } from '../theme';

export function StatusDots({ onPace }: { onPace: boolean }) {
  const color = onPace ? theme.accent : theme.categoryColors.debt;
  return (
    <View style={{ flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.lg }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 56, height: 56, borderRadius: theme.radius.pill, backgroundColor: color }} />
      ))}
    </View>
  );
}
```

`apps/mobile/src/design/primitives/PaydayDots.tsx`:
```tsx
import { View } from 'react-native';
import { theme } from '../theme';

export function PaydayDots({ total, elapsed }: { total: number; elapsed: number }) {
  const count = Math.min(Math.max(total, 0), 31);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ width: 10, height: 10, borderRadius: theme.radius.pill, backgroundColor: i < elapsed ? theme.text : theme.line }}
        />
      ))}
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
git add apps/mobile/src/design/primitives
git commit -m "feat(mobile): presentational primitives (SectionHeader, ProgressBar, Fab, StatusDots, PaydayDots)"
```

---

## Task 3: DonutChart (react-native-svg)

**Files:**
- Create: `apps/mobile/src/design/DonutChart.tsx`
- Verify: `tsc --noEmit` + `expo export` (RN)

**Interfaces:**
- Consumes: `PlanBreakdown` from `@coast/engine`, `donutStrokes` from `../viz/geometry`, `theme`.
- Produces: `<DonutChart breakdown={PlanBreakdown} size? topLabel? centerPence?>` — a ring whose segment lengths come from `donutStrokes`, colored via `theme.categoryColors[group]`, with an optional centered label + `Money` value.

- [ ] **Step 1: Implement the donut**

`apps/mobile/src/design/DonutChart.tsx`:
```tsx
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { PlanBreakdown } from '@coast/engine';
import { donutStrokes } from '../viz/geometry';
import { theme } from './theme';
import { AppText } from './primitives/Text';
import { Money } from './primitives/Money';

export function DonutChart({
  breakdown,
  size = 240,
  strokeWidth = 34,
  topLabel,
  centerPence,
}: {
  breakdown: PlanBreakdown;
  size?: number;
  strokeWidth?: number;
  topLabel?: string;
  centerPence?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokes = donutStrokes(breakdown.segments, radius);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle cx={center} cy={center} r={radius} stroke={theme.line} strokeWidth={strokeWidth} fill="none" />
          {strokes.map((s, i) =>
            s.length > 0 ? (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                stroke={theme.categoryColors[s.group]}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${s.length} ${circumference - s.length}`}
                strokeDashoffset={-s.offset}
              />
            ) : null,
          )}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {topLabel ? <AppText variant="label" muted>{topLabel}</AppText> : null}
        {centerPence != null ? <Money pence={centerPence} variant="stat" /> : null}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds (react-native-svg resolves). Root `npm test` stays green.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/design/DonutChart.tsx
git commit -m "feat(mobile): DonutChart via react-native-svg"
```

---

## Task 4: CategoryRow, SegmentedToggle, InfoCard

**Files:**
- Create: `apps/mobile/src/design/primitives/CategoryRow.tsx`, `SegmentedToggle.tsx`, `InfoCard.tsx`
- Verify: `tsc --noEmit` + `expo export` (RN)

**Interfaces:**
- `<CategoryRow color name pence pctLabel fraction expandable?>` — colored dot, name, `Money`, pct label, `ProgressBar(fraction, color)`.
- `<SegmentedToggle options={[string,string]} value onChange>` — two-segment pill toggle; selected segment filled ink, text onDark.
- `<InfoCard title body onDismiss dismissLabel?>` — card with title (accent), body, dismiss pressable.

- [ ] **Step 1: Implement the components**

`apps/mobile/src/design/primitives/CategoryRow.tsx`:
```tsx
import { View } from 'react-native';
import { AppText } from './Text';
import { Money } from './Money';
import { ProgressBar } from './ProgressBar';
import { theme } from '../theme';

export function CategoryRow({
  color, name, pence, pctLabel, fraction,
}: { color: string; name: string; pence: number; pctLabel: string; fraction: number }) {
  return (
    <View style={{ paddingVertical: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
          <View style={{ width: 12, height: 12, borderRadius: theme.radius.pill, backgroundColor: color }} />
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>{name}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
          <Money pence={pence} variant="body" />
          <AppText variant="body" muted>{pctLabel}</AppText>
        </View>
      </View>
      <View style={{ marginTop: theme.space.md }}>
        <ProgressBar fraction={fraction} color={color} />
      </View>
    </View>
  );
}
```

`apps/mobile/src/design/primitives/SegmentedToggle.tsx`:
```tsx
import { View, Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

export function SegmentedToggle({
  options, value, onChange,
}: { options: [string, string]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: theme.radius.pill, padding: theme.space.xs }}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{ flex: 1, paddingVertical: theme.space.md, borderRadius: theme.radius.pill, backgroundColor: selected ? theme.text : 'transparent', alignItems: 'center' }}
          >
            <AppText variant="label" style={{ color: selected ? theme.onDark : theme.text }}>{opt}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
```

`apps/mobile/src/design/primitives/InfoCard.tsx`:
```tsx
import { Pressable } from 'react-native';
import { Card } from './Card';
import { AppText } from './Text';
import { theme } from '../theme';

export function InfoCard({
  title, body, onDismiss, dismissLabel = 'Got it',
}: { title: string; body: string; onDismiss: () => void; dismissLabel?: string }) {
  return (
    <Card>
      <AppText variant="label" style={{ color: theme.accent }}>{title}</AppText>
      <AppText variant="body" style={{ marginTop: theme.space.md }}>{body}</AppText>
      <Pressable onPress={onDismiss} style={{ marginTop: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>{dismissLabel}</AppText>
      </Pressable>
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
git add apps/mobile/src/design/primitives/CategoryRow.tsx apps/mobile/src/design/primitives/SegmentedToggle.tsx apps/mobile/src/design/primitives/InfoCard.tsx
git commit -m "feat(mobile): CategoryRow, SegmentedToggle, InfoCard"
```

---

## Task 5: Home screen

**Files:**
- Modify (rewrite): `apps/mobile/app/(tabs)/index.tsx`
- Verify: `tsc --noEmit` + `expo export` (RN)

**Interfaces:**
- Consumes: `useCoastStore`, `selectSpendRoom`, `selectPayCycle`, `selectLeaksAnnual`, `weekdayLabel`, `paceLabel`, primitives (`Screen`, `AppText`, `Money`, `ProgressBar`, `SectionHeader`, `StatusDots`, `PaydayDots`, `Fab`), `theme`. Uses a `ScrollView` inside `Screen`.

- [ ] **Step 1: Rewrite Home**

`apps/mobile/app/(tabs)/index.tsx`:
```tsx
import { Alert, ScrollView, View } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectSpendRoom, selectPayCycle, selectLeaksAnnual } from '../../src/store/selectors';
import { weekdayLabel, paceLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { ProgressBar } from '../../src/design/primitives/ProgressBar';
import { SectionHeader } from '../../src/design/primitives/SectionHeader';
import { StatusDots } from '../../src/design/primitives/StatusDots';
import { PaydayDots } from '../../src/design/primitives/PaydayDots';
import { Fab } from '../../src/design/primitives/Fab';
import { formatGBP } from '@coast/core';
import { theme } from '../../src/design/theme';

export default function Home() {
  const data = useCoastStore((s) => s.data);
  const now = new Date();
  const room = selectSpendRoom(data, now);
  const cycle = selectPayCycle(data, now);
  const pace = paceLabel(room);
  const elapsed = cycle.cycleLengthDays - cycle.daysUntilPayday;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>{weekdayLabel(now)}</AppText>
        </View>

        <StatusDots onPace={room.onPace} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.xl }}>
          <AppText variant="label" muted>TODAY'S SPEND ROOM</AppText>
          <AppText variant="label" muted>What's this?</AppText>
        </View>
        <Money pence={room.dailyRoom} variant="hero" />
        <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>
          {formatGBP(room.leftUntilPayday)} left until payday
        </AppText>
        <AppText variant="body">{pace.text}</AppText>
        <AppText variant="body" muted>Bills and essentials protected.</AppText>

        <AppText variant="body" muted style={{ marginTop: theme.space.lg }}>
          Spent today: <Money pence={room.spentToday} variant="body" /> of <Money pence={room.dailyRoom} variant="body" />
        </AppText>
        <View style={{ marginTop: theme.space.sm }}>
          <ProgressBar fraction={room.dailyRoom > 0 ? room.spentToday / room.dailyRoom : 0} />
        </View>

        <SectionHeader label="UNTIL PAYDAY" />
        <PaydayDots total={cycle.cycleLengthDays} elapsed={elapsed} />
        <AppText variant="title" style={{ marginTop: theme.space.md }}>Until payday — {cycle.daysUntilPayday} days left</AppText>
        <AppText variant="body" muted>{formatGBP(room.leftUntilPayday)} left until payday</AppText>

        <View style={{ marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg, flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Set aside</AppText>
          <AppText variant="body" muted>{data.funds.length === 0 ? 'Nothing set aside yet' : `${data.funds.length} funds`}</AppText>
        </View>
        <View style={{ marginTop: theme.space.lg, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg, flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Your leaks</AppText>
          <AppText variant="body" muted>{formatGBP(selectLeaksAnnual(data))}/yr total</AppText>
        </View>

        <SectionHeader label="RECENT" right="ALL ACTIVITY" />
        {data.transactions.length === 0 ? (
          <AppText variant="body" muted>Nothing logged yet.</AppText>
        ) : (
          data.transactions.slice(0, 5).map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md }}>
              <AppText variant="body">{t.merchant ?? t.note ?? t.categoryId}</AppText>
              <Money pence={t.amount} variant="body" />
            </View>
          ))
        )}
      </ScrollView>
      <Fab onPress={() => Alert.alert('Quick add', 'Logging arrives in the next update.')} />
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
git add "apps/mobile/app/(tabs)/index.tsx"
git commit -m "feat(mobile): real Home screen (spend room, payday, leaks, recent)"
```

---

## Task 6: Activity screen

**Files:**
- Modify (rewrite): `apps/mobile/app/(tabs)/activity.tsx`
- Verify: `tsc --noEmit` + `expo export` (RN)

**Interfaces:**
- Consumes: `useCoastStore`, `selectPayCycleAtOffset`, `selectCycleSummaryAtOffset`, `selectCycleTransactions` (from `cycleNav.ts`), `cycleLabel`, primitives (`Screen`, `AppText`, `Money`, `CategoryRow`, `SectionHeader`), `theme`. Local `offset` state (`useState(0)`), `<` decrements, `>` increments. Category group → display name + `theme.categoryColors[group]`.

- [ ] **Step 1: Rewrite Activity**

`apps/mobile/app/(tabs)/activity.tsx`:
```tsx
import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectPayCycleAtOffset, selectCycleSummaryAtOffset, selectCycleTransactions } from '../../src/store/cycleNav';
import { cycleLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { CategoryRow } from '../../src/design/primitives/CategoryRow';
import { SectionHeader } from '../../src/design/primitives/SectionHeader';
import { theme } from '../../src/design/theme';

const GROUP_NAMES: Record<string, string> = {
  discretionary: 'Discretionary',
  bills: 'Bills & Fixed',
  savings: 'Savings',
};

export default function Activity() {
  const data = useCoastStore((s) => s.data);
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const cycle = selectPayCycleAtOffset(data, now, offset);
  const summary = selectCycleSummaryAtOffset(data, now, offset);
  const txns = selectCycleTransactions(data, now, offset);
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>ACTIVITY</AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.space.xl }}>
          <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={12}><AppText variant="title">‹</AppText></Pressable>
          <AppText variant="title" style={{ fontSize: 22, lineHeight: 26 }}>{cycleLabel(cycle)}</AppText>
          <Pressable onPress={() => setOffset((o) => o + 1)} hitSlop={12}><AppText variant="title">›</AppText></Pressable>
        </View>
        <AppText variant="label" muted style={{ textAlign: 'center' }}>Pay cycle activity</AppText>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>SPENT THIS PAY CYCLE</AppText>
        <Money pence={summary.totalSpent} variant="hero" />
        <AppText variant="body" muted>{pct(summary.pctOfIncome)} of monthly income</AppText>

        <View style={{ marginTop: theme.space.lg }}>
          {summary.groups.map((g) => (
            <CategoryRow
              key={g.group}
              color={theme.categoryColors[g.group]}
              name={GROUP_NAMES[g.group] ?? g.group}
              pence={g.spent}
              pctLabel={pct(g.pctOfIncome)}
              fraction={g.allocated > 0 ? g.spent / g.allocated : 0}
            />
          ))}
        </View>

        <SectionHeader label="TRANSACTIONS" right={`${txns.length} this period`} />
        {txns.length === 0 ? (
          <AppText variant="body" muted>No transactions for {cycleLabel(cycle)}.</AppText>
        ) : (
          txns.map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md }}>
              <AppText variant="body">{t.merchant ?? t.note ?? t.categoryId}</AppText>
              <Money pence={t.amount} variant="body" />
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
git add "apps/mobile/app/(tabs)/activity.tsx"
git commit -m "feat(mobile): real Activity screen (cycle nav, category breakdown, transactions)"
```

---

## Task 7: Plan screen

**Files:**
- Modify (rewrite): `apps/mobile/app/(tabs)/plan.tsx`
- Verify: `tsc --noEmit` + `expo export` (RN)

**Interfaces:**
- Consumes: `useCoastStore`, `selectPlanBreakdown`, `monthLabel`, `DonutChart`, primitives (`Screen`, `AppText`, `Money`, `SegmentedToggle`, `InfoCard`), `theme`. Local state: `tab` ('Budget'|'Income'), `showInfo` (boolean, default true). Legend group → name + `theme.categoryColors[group]`.

- [ ] **Step 1: Rewrite Plan**

`apps/mobile/app/(tabs)/plan.tsx`:
```tsx
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectPlanBreakdown } from '../../src/store/selectors';
import { monthLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { SegmentedToggle } from '../../src/design/primitives/SegmentedToggle';
import { InfoCard } from '../../src/design/primitives/InfoCard';
import { DonutChart } from '../../src/design/DonutChart';
import { theme } from '../../src/design/theme';

const GROUP_NAMES: Record<string, string> = {
  bills: 'Bills & Fixed',
  savings: 'Savings',
  debt: 'Debt',
  discretionary: 'Discretionary',
};

const PLAN_BODY =
  'Your income splits four ways — bills, savings, debt and flexible spending. Inside flexible spending, Essentials are tracked monthly so daily wobbles don’t punish you. Lifestyle is what your daily safe-to-spend watches. Joy is protected.';

export default function Plan() {
  const data = useCoastStore((s) => s.data);
  const [tab, setTab] = useState('Budget');
  const [showInfo, setShowInfo] = useState(true);
  const now = new Date();
  const breakdown = selectPlanBreakdown(data);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>PLAN</AppText>
        </View>

        <View style={{ marginTop: theme.space.lg }}>
          <SegmentedToggle options={['Budget', 'Income']} value={tab} onChange={setTab} />
        </View>

        {tab === 'Budget' ? (
          <>
            {showInfo ? (
              <View style={{ marginTop: theme.space.lg }}>
                <InfoCard title="HOW YOUR PLAN WORKS" body={PLAN_BODY} onDismiss={() => setShowInfo(false)} />
              </View>
            ) : null}

            <View style={{ alignItems: 'center', marginTop: theme.space.xl }}>
              <DonutChart breakdown={breakdown} topLabel={monthLabel(now)} centerPence={breakdown.total} />
            </View>

            <View style={{ marginTop: theme.space.xl }}>
              {breakdown.segments.map((s) => (
                <View key={s.group} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.space.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
                    <View style={{ width: 12, height: 12, borderRadius: theme.radius.pill, backgroundColor: theme.categoryColors[s.group] }} />
                    <AppText variant="body">{GROUP_NAMES[s.group] ?? s.group}</AppText>
                  </View>
                  <Money pence={s.amount} variant="body" />
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="label" muted>MONTHLY INCOME</AppText>
            <Money pence={data.income.monthly} variant="hero" />
            <AppText variant="body" muted>Paid on day {data.income.paydayDom} each month.</AppText>
          </View>
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
git add "apps/mobile/app/(tabs)/plan.tsx"
git commit -m "feat(mobile): real Plan screen (donut, toggle, plan explainer)"
```

---

## Post-plan acceptance (controller, not a subagent task)

After Task 7, the controller launches the app in the iOS Simulator (or documents deferral) and confirms: Home shows £8.13 spend room + "22 days left" + "£2,860/yr" leaks; Activity shows the "31 Jul — 30 Aug 2026" cycle with the three category rows at £0/0%, and `‹`/`›` change the cycle label; Plan shows the donut with center "AUGUST £2,065" and a 4-row legend, and the Budget/Income toggle switches. If no simulator is available, the `expo export` bundle + `tsc` + Jest suites stand as automated acceptance, and the visual check is deferred to the user's machine.

## Self-Review

**Spec coverage (design spec §7 Home/Activity/Plan slice + screenshots):**
- Home: spend room, days-to-payday, set-aside, leaks, recent, FAB → Task 5 (+ primitives 2, helpers 1).
- Activity: cycle navigator, spent-this-cycle, category rows, transactions → Task 6 (+ CategoryRow 4, cycleNav 1).
- Plan: Budget/Income toggle, explainer, donut + legend → Task 7 (+ DonutChart 3, SegmentedToggle/InfoCard 4, geometry/format 1).
- Payments, Profile, Weekly Statement → Plan 3b. Quick-add/onboarding/CSV/Shortcut → Plan 4 (FAB is a stub here).

**Placeholder scan:** No TBD/TODO. Pure helpers (Task 1) are TDD with real tests; RN tasks (2–7) are verified by `tsc --noEmit` + `expo export` (stated explicitly). The FAB stub is intentional and documented.

**Type consistency check:** `PlanSegment`/`PlanBreakdown`/`PayCycle`/`SpendRoom`/`CycleSummary` are real `@coast/engine` exports (verified). `donutStrokes` returns `group` from `PlanSegment['group']`, consumed by `DonutChart` via `theme.categoryColors[group]` (keys bills/savings/debt/discretionary match `theme.categoryColors`). Selectors `selectSpendRoom`/`selectPayCycle`/`selectPlanBreakdown`/`selectLeaksAnnual` exist from Plan 2; new offset selectors live in `cycleNav.ts`. `PayCycle.cycleLengthDays`/`daysUntilPayday`/`start`/`displayEnd`/`nextPayday` are the real field names (verified in `packages/engine/src/payCycle.ts`). `CycleSummary.groups[].{group,spent,allocated,pctOfIncome}` and `.totalSpent`/`.pctOfIncome` match `packages/engine/src/cycleSummary.ts`. `formatGBP` imported from `@coast/core`. Screens pass `new Date()` at the edge; pure modules never call it.
```
