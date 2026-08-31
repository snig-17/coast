# Coast Onboarding Wizard Implementation Plan (Plan 4b)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A first-launch onboarding wizard that collects the user's income, essentials, extras, and optional savings/debt, computes a real `Income` + `BudgetPlan` from those numbers, and commits it via `completeOnboarding` — so Coast runs on the user's own figures instead of the demo seed. The wizard is forced when onboarding is incomplete and re-runnable from Profile.

**Architecture:** A pure mapping layer (`src/store/onboarding.ts`, Jest-tested) turns raw inputs (with weekly/monthly cadence) into `{ income, plan }`. A single wizard route (`app/onboarding.tsx`) holds step state and text inputs, previews the computed plan, and on finish calls the store `completeOnboarding` then navigates to the tabs. A gate in `(tabs)/_layout.tsx` redirects to `/onboarding` while `onboardingComplete` is false. Persistence (wired in Plan 4a) saves the completed state, so onboarding shows only once.

**Tech Stack:** Expo + expo-router (`Redirect`), React Native, TypeScript strict, existing store (`completeOnboarding`) + `@coast/core` (`parseAmount`, `Income`, `BudgetPlan`, `Pence`), primitives + `SegmentedToggle`. Jest for the pure mapping; `expo export` bundle + `tsc --noEmit` + iOS Simulator for RN.

## Global Constraints

- **Reuse, don't rebuild:** amount parsing via `@coast/core` `parseAmount` (pounds string → pence); commit via the store's `completeOnboarding(income, plan)`. No new finance math beyond the documented cadence/plan mapping.
- **Money is integer pence.** User amounts are pounds strings parsed with `parseAmount`. Money rendered only via `Money`/`formatGBP`.
- **Determinism:** the mapping (`src/store/onboarding.ts`) is pure, inputs only — no `Date.now()`/argless `new Date()`/`Math.random()`. The wizard reads no clock.
- **No hardcoded style values** in components (theme tokens; brief intrinsics allowed). Thin screens. TS strict. Root `npm test` + `cd apps/mobile && npx tsc --noEmit` stay clean. RN tasks verified by `tsc` + `expo export`; the mapping task is Jest TDD.
- **Plan mapping (fixed, documented):** `monthlyFromCadence(amount, 'weekly') = round(amount * 52 / 12)`, `('monthly') = amount`. `buildOnboarding`: `bills = monthly(essentials)`, `savings = savingsMonthly`, `debt = debtMonthly`, `discretionary = monthly(extras)`, `essentials(subpool) = 0`, `lifestyle = round(discretionary * 0.8)`, `joy = discretionary - lifestyle`. (The 0.8 lifestyle / 0.2 joy split is a chosen default; tunable later.)

## Scope note

Plan 4b = the onboarding wizard + its gate + a re-run entry point. CSV import = Plan 4c; polish = Plan 5. Per-category budgets are **deferred** — this wizard captures income, essentials total, extras total (each weekly/monthly), and optional savings/debt monthly targets; categories keep their catalog defaults. Completing onboarding replaces `income`/`plan` and sets `onboardingComplete = true` (it does not wipe seeded payments/leaks/statements — those remain until the user edits them in later plans).

## File structure

```
apps/mobile/
  src/store/
    onboarding.ts          # monthlyFromCadence, buildOnboarding  (pure)
  src/__tests__/
    onboarding.test.ts
  app/
    onboarding.tsx         # the wizard (steps, inputs, review, finish)
    (tabs)/
      _layout.tsx          # gate: Redirect to /onboarding when incomplete
      profile.tsx          # add a "Redo onboarding ›" row → /onboarding
```

---

## Task 1: Pure onboarding mapping

**Files:**
- Create: `apps/mobile/src/store/onboarding.ts`, `apps/mobile/src/__tests__/onboarding.test.ts`

**Interfaces:**
- Consumes: `@coast/core` (`Income`, `BudgetPlan`, `Pence`).
- Produces: `type Cadence = 'weekly' | 'monthly'`; `monthlyFromCadence(amount: Pence, cadence: Cadence): Pence`; `interface CadenceAmount { amount: Pence; cadence: Cadence }`; `interface OnboardingInput { incomeMonthly: Pence; paydayDom: number; essentials: CadenceAmount; extras: CadenceAmount; savingsMonthly: Pence; debtMonthly: Pence }`; `buildOnboarding(input: OnboardingInput): { income: Income; plan: BudgetPlan }`.

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/__tests__/onboarding.test.ts`:
```ts
import { monthlyFromCadence, buildOnboarding, OnboardingInput } from '../store/onboarding';

describe('monthlyFromCadence', () => {
  it('passes monthly through and annualises weekly to a month', () => {
    expect(monthlyFromCadence(120000, 'monthly')).toBe(120000);
    expect(monthlyFromCadence(10000, 'weekly')).toBe(Math.round((10000 * 52) / 12)); // 43333
  });
});

describe('buildOnboarding', () => {
  const input: OnboardingInput = {
    incomeMonthly: 300000,
    paydayDom: 25,
    essentials: { amount: 120000, cadence: 'monthly' },
    extras: { amount: 60000, cadence: 'monthly' },
    savingsMonthly: 20000,
    debtMonthly: 0,
  };

  it('maps income + payday', () => {
    expect(buildOnboarding(input).income).toEqual({ monthly: 300000, paydayDom: 25 });
  });

  it('maps essentials→bills, extras→discretionary, and splits lifestyle/joy 80/20', () => {
    const { plan } = buildOnboarding(input);
    expect(plan.bills).toBe(120000);
    expect(plan.savings).toBe(20000);
    expect(plan.debt).toBe(0);
    expect(plan.discretionary).toBe(60000);
    expect(plan.essentials).toBe(0);
    expect(plan.lifestyle).toBe(48000); // round(60000 * 0.8)
    expect(plan.joy).toBe(12000);       // discretionary - lifestyle
    expect(plan.essentials + plan.lifestyle + plan.joy).toBe(plan.discretionary);
  });

  it('converts a weekly extras amount to monthly before splitting', () => {
    const weekly = buildOnboarding({ ...input, extras: { amount: 15000, cadence: 'weekly' } }).plan;
    const monthly = Math.round((15000 * 52) / 12); // 65000
    expect(weekly.discretionary).toBe(monthly);
    expect(weekly.lifestyle).toBe(Math.round(monthly * 0.8));
    expect(weekly.joy).toBe(monthly - Math.round(monthly * 0.8));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest onboarding`
Expected: FAIL — `Cannot find module '../store/onboarding'`.

- [ ] **Step 3: Implement the mapping**

`apps/mobile/src/store/onboarding.ts`:
```ts
import { Income, BudgetPlan, Pence } from '@coast/core';

export type Cadence = 'weekly' | 'monthly';

export interface CadenceAmount {
  amount: Pence;
  cadence: Cadence;
}

export interface OnboardingInput {
  incomeMonthly: Pence;
  paydayDom: number;
  essentials: CadenceAmount;
  extras: CadenceAmount;
  savingsMonthly: Pence;
  debtMonthly: Pence;
}

export function monthlyFromCadence(amount: Pence, cadence: Cadence): Pence {
  return cadence === 'weekly' ? Math.round((amount * 52) / 12) : amount;
}

export function buildOnboarding(input: OnboardingInput): { income: Income; plan: BudgetPlan } {
  const income: Income = { monthly: input.incomeMonthly, paydayDom: input.paydayDom };

  const bills = monthlyFromCadence(input.essentials.amount, input.essentials.cadence);
  const discretionary = monthlyFromCadence(input.extras.amount, input.extras.cadence);
  const lifestyle = Math.round(discretionary * 0.8);
  const joy = discretionary - lifestyle;

  const plan: BudgetPlan = {
    bills,
    savings: input.savingsMonthly,
    debt: input.debtMonthly,
    discretionary,
    essentials: 0,
    lifestyle,
    joy,
  };

  return { income, plan };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest onboarding`
Expected: PASS. Then `npm test` (full suite) stays green + pristine.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/store/onboarding.ts apps/mobile/src/__tests__/onboarding.test.ts
git commit -m "feat(mobile): pure onboarding mapping (inputs -> income + plan)"
```

---

## Task 2: Onboarding wizard route (`app/onboarding.tsx`)

**Files:**
- Create: `apps/mobile/app/onboarding.tsx`
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- Consumes: `useRouter` (expo-router), `useCoastStore` (`completeOnboarding`), `parseAmount` (`@coast/core`), `buildOnboarding`/`OnboardingInput` (`../src/store/onboarding`), primitives (`Screen`, `AppText`, `Money`, `PillButton`, `SegmentedToggle`), `theme`, RN `TextInput`/`ScrollView`/`Pressable`/`View`.
- Behavior: a stepped wizard (Welcome → Income → Essentials → Extras → Savings & Debt → Review). Amounts are pounds `TextInput`s; cadence uses `SegmentedToggle(['Weekly','Monthly'])`; payday is a numeric input clamped to 1–31. Review shows the computed plan via `Money`. Finish calls `completeOnboarding(income, plan)` and `router.replace('/')`.

- [ ] **Step 1: Implement the wizard**

`apps/mobile/app/onboarding.tsx`:
```tsx
import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { parseAmount } from '@coast/core';
import { useCoastStore } from '../src/store/store';
import { buildOnboarding, OnboardingInput, Cadence } from '../src/store/onboarding';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Money } from '../src/design/primitives/Money';
import { PillButton } from '../src/design/primitives/PillButton';
import { SegmentedToggle } from '../src/design/primitives/SegmentedToggle';
import { theme } from '../src/design/theme';

const STEPS = ['Welcome', 'Income', 'Essentials', 'Extras', 'Savings & Debt', 'Review'] as const;

function AmountField({ value, onChangeText, placeholder = '0.00' }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      style={{ fontFamily: theme.type.title.family, fontSize: theme.type.title.size, color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.sm }}
    />
  );
}

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useCoastStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('');
  const [payday, setPayday] = useState('25');
  const [essAmount, setEssAmount] = useState('');
  const [essCad, setEssCad] = useState<Cadence>('monthly');
  const [extAmount, setExtAmount] = useState('');
  const [extCad, setExtCad] = useState<Cadence>('monthly');
  const [savings, setSavings] = useState('');
  const [debt, setDebt] = useState('');

  const clampDay = (n: number) => (Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 1), 31) : 1);

  const input: OnboardingInput = {
    incomeMonthly: parseAmount(income),
    paydayDom: clampDay(parseInt(payday || '1', 10)),
    essentials: { amount: parseAmount(essAmount), cadence: essCad },
    extras: { amount: parseAmount(extAmount), cadence: extCad },
    savingsMonthly: parseAmount(savings),
    debtMonthly: parseAmount(debt),
  };
  const { plan } = buildOnboarding(input);

  const canProceed = step !== 1 || input.incomeMonthly > 0;
  const isLast = step === STEPS.length - 1;

  const onNext = () => {
    if (!canProceed) return;
    if (isLast) {
      const { income: inc, plan: p } = buildOnboarding(input);
      completeOnboarding(inc, p);
      router.replace('/');
    } else {
      setStep((s) => s + 1);
    }
  };

  const cad = (value: Cadence, onChange: (c: Cadence) => void) => (
    <View style={{ marginTop: theme.space.md }}>
      <SegmentedToggle
        options={['Weekly', 'Monthly']}
        value={value === 'weekly' ? 'Weekly' : 'Monthly'}
        onChange={(v) => onChange(v === 'Weekly' ? 'weekly' : 'monthly')}
      />
    </View>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <AppText variant="label" muted>COAST</AppText>
        <AppText variant="label" muted>STEP {step + 1} OF {STEPS.length}</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
        {step === 0 && (
          <View style={{ marginTop: theme.space.xxl }}>
            <AppText variant="hero">Welcome to Coast.</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.md }}>
              A few numbers and Coast will show what's safe to spend today — built from your money, not a demo.
            </AppText>
          </View>
        )}

        {step === 1 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Your monthly income</AppText>
            <AmountField value={income} onChangeText={setIncome} />
            <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>PAYDAY (DAY OF MONTH)</AppText>
            <TextInput
              value={payday}
              onChangeText={setPayday}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={theme.textMuted}
              style={{ fontFamily: theme.type.title.family, fontSize: theme.type.title.size, color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.sm }}
            />
          </View>
        )}

        {step === 2 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Essentials & bills</AppText>
            <AppText variant="body" muted>Rent, utilities, groceries — the necessary stuff.</AppText>
            <AmountField value={essAmount} onChangeText={setEssAmount} />
            {cad(essCad, setEssCad)}
          </View>
        )}

        {step === 3 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Everyday extras</AppText>
            <AppText variant="body" muted>Eating out, fun, the flexible spending Coast watches daily.</AppText>
            <AmountField value={extAmount} onChangeText={setExtAmount} />
            {cad(extCad, setExtCad)}
          </View>
        )}

        {step === 4 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Savings & debt</AppText>
            <AppText variant="body" muted>Optional monthly targets. Leave blank for none.</AppText>
            <AppText variant="label" muted style={{ marginTop: theme.space.lg }}>SAVINGS / MONTH</AppText>
            <AmountField value={savings} onChangeText={setSavings} />
            <AppText variant="label" muted style={{ marginTop: theme.space.lg }}>DEBT / MONTH</AppText>
            <AmountField value={debt} onChangeText={setDebt} />
          </View>
        )}

        {step === 5 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Your plan</AppText>
            {[
              ['Income', input.incomeMonthly],
              ['Bills & Fixed', plan.bills],
              ['Discretionary', plan.discretionary],
              ['Savings', plan.savings],
              ['Debt', plan.debt],
            ].map(([label, pence]) => (
              <View key={label as string} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
                <AppText variant="body">{label as string}</AppText>
                <Money pence={pence as number} variant="body" />
              </View>
            ))}
            <AppText variant="body" muted style={{ marginTop: theme.space.lg }}>
              Daily spend room comes from your Lifestyle slice (<Money pence={plan.lifestyle} variant="body" />/mo).
            </AppText>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.lg }}>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={{ justifyContent: 'center', paddingHorizontal: theme.space.lg }}>
            <AppText variant="label" muted>Back</AppText>
          </Pressable>
        ) : null}
        <View style={{ flex: 1, opacity: canProceed ? 1 : 0.4 }}>
          <PillButton label={isLast ? 'START COAST' : 'CONTINUE'} onPress={onNext} />
        </View>
      </View>
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
git add apps/mobile/app/onboarding.tsx
git commit -m "feat(mobile): onboarding wizard (income, essentials, extras, savings/debt, review)"
```

---

## Task 3: Gate the app on onboarding + Profile re-run entry

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx` (redirect to `/onboarding` when `!onboardingComplete`)
- Modify: `apps/mobile/app/(tabs)/profile.tsx` (add a "Redo onboarding ›" row → `/onboarding`)
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- `(tabs)/_layout.tsx` consumes `useCoastStore` + `Redirect` from expo-router.
- `profile.tsx` already has `useRouter` + `Pressable`; adds one row like the existing "Automate logging" row.

- [ ] **Step 1: Add the gate**

In `apps/mobile/app/(tabs)/_layout.tsx`, add imports:
```tsx
import { Tabs, Redirect } from 'expo-router';
import { useCoastStore } from '../../src/store/store';
```
At the top of the `TabsLayout` component body, before returning `<Tabs …>`:
```tsx
const onboardingComplete = useCoastStore((s) => s.data.onboardingComplete);
if (!onboardingComplete) return <Redirect href="/onboarding" />;
```
Leave the rest of the Tabs config unchanged.

- [ ] **Step 2: Add the Profile re-run row**

In `apps/mobile/app/(tabs)/profile.tsx`, directly after the existing "Automate logging ›" `Pressable` row, add:
```tsx
<Pressable onPress={() => router.push('/onboarding')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
  <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Redo onboarding</AppText>
  <AppText variant="title" style={{ color: theme.accent }}>›</AppText>
</Pressable>
```
(`Pressable`, `router`, `AppText`, `theme` are already imported in profile.tsx.)

- [ ] **Step 3: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds. Root `npm test` stays green.

- [ ] **Step 4: Commit**

```bash
git add "apps/mobile/app/(tabs)/_layout.tsx" "apps/mobile/app/(tabs)/profile.tsx"
git commit -m "feat(mobile): gate app on onboarding + Profile re-run entry"
```

---

## Post-plan acceptance (controller, not a subagent task)

After Task 3, the controller launches the app in the iOS Simulator (or documents deferral). Because the seed sets `onboardingComplete: false`, a fresh install should open onto the wizard; stepping through it (income + payday, essentials, extras, optional savings/debt) and tapping "Start Coast" should land on the Home tab with the spend room now derived from the entered numbers (and, thanks to Plan 4a persistence, onboarding should not reappear on relaunch). "Redo onboarding" from Profile reopens the wizard. If no simulator is available, the `expo export` bundle + `tsc` + Jest suites stand as automated acceptance, deferred to the user's machine.

## Self-Review

**Spec coverage (design spec §6/§7 onboarding slice):**
- Income + payday, essentials (amount + cadence), extras (amount + cadence), optional savings/debt → Task 2 (+ mapping T1).
- Compute real Income + BudgetPlan and commit via `completeOnboarding` → Task 1 mapping + Task 2 finish.
- Forced on first launch, re-runnable → Task 3 gate + Profile row.
- Per-category budgets → explicitly deferred (categories keep catalog defaults).

**Placeholder scan:** No TBD/TODO. Pure mapping (T1) is TDD; RN tasks verified by `tsc` + `expo export`. The 0.8/0.2 lifestyle/joy split and the essentials→bills mapping are documented product defaults, not placeholders.

**Type consistency check:** `parseAmount`/`Income`/`BudgetPlan`/`Pence` are real `@coast/core` exports (verified). `completeOnboarding(income: Income, plan: BudgetPlan)` matches the store (verified). `BudgetPlan` fields (`bills, savings, debt, discretionary, essentials, lifestyle, joy`) match `packages/core/src/types.ts`; `essentials+lifestyle+joy === discretionary` holds by construction. `SegmentedToggle` takes `options: [string,string]`, `value`, `onChange` (from Plan 3). `Redirect`/`useRouter` are expo-router exports; `data.onboardingComplete` exists on `CoastState`. `theme.type.title`, `theme.textMuted`, `theme.line` exist. The gate reads the store reactively, so `completeOnboarding` flipping the flag removes the redirect and the finish's `router.replace('/')` lands on the tabs without a loop.
```
