# Coast Quick-Add + Shortcut Intake Implementation Plan (Plan 4a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make logging real. Add a quick-add entry sheet (amount + category + note → saved to the store), reachable from the Home `+` FAB, that ALSO opens pre-filled from a `coast://add?…` deep link — so an iOS Shortcut the user taps when they pay can push a transaction into Coast. Plus an in-app "Automate logging" screen that guides building that Shortcut.

**Architecture:** A pure params-parsing layer (`src/store/addEntry.ts`, Jest-tested) turns route/deep-link params into a validated transaction. A modal-style expo-router route `app/add.tsx` renders the form (pre-filled from `useLocalSearchParams`) and commits via the existing `addTransaction` store action. The `coast://add` deep link resolves to that same route via expo-router linking (the `coast` scheme is already declared). `app/automate.tsx` is a static guide with a copyable URL template.

**Tech Stack:** Expo + expo-router (deep linking via the existing `coast` scheme), React Native, TypeScript strict, existing store/`@coast/core` (`parseAmount`, `categorize`, `CATEGORIES`), `expo-clipboard` (new, for the copyable template). Jest for the pure parser; `expo export` bundle + `tsc --noEmit` + iOS Simulator for RN.

## Global Constraints

- **Reuse, don't rebuild:** amount parsing via `@coast/core` `parseAmount` (pounds string → pence); merchant categorisation via `categorize`; commit via the store's `addTransaction`. No new finance math.
- **Money is integer pence.** Deep-link/user amounts are pounds strings ("8.13", "£8.13") parsed to pence with `parseAmount`.
- **Money rendered only via `Money`/`formatGBP`.** No hardcoded style values (theme tokens; brief intrinsics allowed). Thin screens. TS strict.
- **Determinism:** the pure parser (`src/store/addEntry.ts`) takes inputs only — no `Date.now()`/argless `new Date()`/`Math.random()`. The `add` screen generates the transaction id + today's date at the UI edge (allowed there).
- **Deep-link safety:** a `coast://add?…` link never writes silently — it opens the pre-filled quick-add sheet, and the user taps Save to commit. (Silent-add is an explicit future option, not this build.)
- **Native deps via `npx expo install`.** Root `npm test` + `cd apps/mobile && npx tsc --noEmit` stay clean. RN tasks verified by `tsc` + `expo export`; the pure task is Jest TDD.

## Scope note

Plan 4a = **quick-add + Shortcut intake + automate guide**. Onboarding wizard = Plan 4b; CSV import UI = Plan 4c. Data-entry here writes real transactions (they appear on Home "Recent" and in Activity). The Home FAB stops being a stub. Profile's "Settings" stays a stub; a new "Automate logging" entry point is added.

## File structure

```
apps/mobile/
  src/store/
    addEntry.ts            # parseAddParams, buildTransaction   (pure)
  src/__tests__/
    addEntry.test.ts
  app/
    add.tsx                # quick-add sheet (form + save; prefilled from params)
    automate.tsx           # Shortcut setup guide + copyable coast://add template
    (tabs)/
      index.tsx            # FAB → router.push('/add') (replace Alert stub)
      profile.tsx          # add an "Automate logging ›" row → /automate
```

---

## Task 1: Pure add-entry parser

**Files:**
- Create: `apps/mobile/src/store/addEntry.ts`, `apps/mobile/src/__tests__/addEntry.test.ts`

**Interfaces:**
- Consumes: `@coast/core` (`parseAmount`, `categorize`, `Category`, `Transaction`, `Pence`).
- Produces: `interface AddParams { amount?: string; category?: string; note?: string; merchant?: string }`; `interface ParsedEntry { amount: Pence; categoryId: string; note?: string; merchant?: string }`; `parseAddParams(params: AddParams, categories: Category[]): ParsedEntry`; `buildTransaction(parsed: ParsedEntry, dateIso: string, id: string): Transaction`.

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/__tests__/addEntry.test.ts`:
```ts
import { CATEGORIES } from '@coast/core';
import { parseAddParams, buildTransaction } from '../store/addEntry';

describe('parseAddParams', () => {
  it('parses a pounds amount and a valid category id', () => {
    expect(parseAddParams({ amount: '8.13', category: 'eating_out' }, CATEGORIES)).toEqual({
      amount: 813,
      categoryId: 'eating_out',
    });
  });
  it('accepts a £-prefixed amount', () => {
    expect(parseAddParams({ amount: '£12.50', category: 'shopping' }, CATEGORIES).amount).toBe(1250);
  });
  it('auto-categorises from merchant when no valid category is given', () => {
    const p = parseAddParams({ amount: '4.50', merchant: 'Pret A Manger' }, CATEGORIES);
    expect(p.categoryId).toBe('eating_out');
    expect(p.merchant).toBe('Pret A Manger');
  });
  it('falls back to uncategorised for unknown category + no merchant', () => {
    expect(parseAddParams({ amount: '3', category: 'nope' }, CATEGORIES).categoryId).toBe('uncategorised');
  });
  it('treats a junk amount as zero', () => {
    expect(parseAddParams({ amount: 'abc' }, CATEGORIES).amount).toBe(0);
  });
  it('keeps a provided note', () => {
    expect(parseAddParams({ amount: '1', note: 'Coffee' }, CATEGORIES).note).toBe('Coffee');
  });
});

describe('buildTransaction', () => {
  it('assembles a manual transaction with the given id and date', () => {
    const parsed = { amount: 813, categoryId: 'eating_out', note: 'Coffee', merchant: 'Pret' };
    expect(buildTransaction(parsed, '2026-08-09', 't_1')).toEqual({
      id: 't_1',
      amount: 813,
      categoryId: 'eating_out',
      date: '2026-08-09',
      note: 'Coffee',
      merchant: 'Pret',
      source: 'manual',
    });
  });
  it('omits optional note/merchant when absent', () => {
    const t = buildTransaction({ amount: 500, categoryId: 'uncategorised' }, '2026-08-09', 't_2');
    expect(t.note).toBeUndefined();
    expect(t.merchant).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest addEntry`
Expected: FAIL — `Cannot find module '../store/addEntry'`.

- [ ] **Step 3: Implement the parser**

`apps/mobile/src/store/addEntry.ts`:
```ts
import { parseAmount, categorize, Category, Transaction, Pence } from '@coast/core';

export interface AddParams {
  amount?: string;
  category?: string;
  note?: string;
  merchant?: string;
}

export interface ParsedEntry {
  amount: Pence;
  categoryId: string;
  note?: string;
  merchant?: string;
}

export function parseAddParams(params: AddParams, categories: Category[]): ParsedEntry {
  const amount = parseAmount(params.amount ?? '');

  let categoryId: string;
  if (params.category && categories.some((c) => c.id === params.category)) {
    categoryId = params.category;
  } else if (params.merchant || params.note) {
    categoryId = categorize(params.merchant ?? params.note ?? '');
  } else {
    categoryId = 'uncategorised';
  }

  const entry: ParsedEntry = { amount, categoryId };
  if (params.note) entry.note = params.note;
  if (params.merchant) entry.merchant = params.merchant;
  return entry;
}

export function buildTransaction(parsed: ParsedEntry, dateIso: string, id: string): Transaction {
  const t: Transaction = {
    id,
    amount: parsed.amount,
    categoryId: parsed.categoryId,
    date: dateIso,
    source: 'manual',
  };
  if (parsed.note) t.note = parsed.note;
  if (parsed.merchant) t.merchant = parsed.merchant;
  return t;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest addEntry`
Expected: PASS. Then `npm test` (full suite) stays green + pristine.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/store/addEntry.ts apps/mobile/src/__tests__/addEntry.test.ts
git commit -m "feat(mobile): pure add-entry parser (deep-link/form params -> transaction)"
```

---

## Task 2: Quick-add sheet route (`app/add.tsx`)

**Files:**
- Create: `apps/mobile/app/add.tsx`
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- Consumes: `useLocalSearchParams`/`useRouter` (expo-router), `useCoastStore` (`data`, `addTransaction`), `parseAddParams`/`buildTransaction`, primitives (`Screen`, `AppText`, `Money`, `PillButton`), `theme`, RN `TextInput`.
- Behavior: pre-fills `amount`/`category`/`note`/`merchant` from route params; amount is a numeric `TextInput`; category chips come from the discretionary categories; Save commits `addTransaction(buildTransaction(parseAddParams(form, data.categories), todayIso, id))` and `router.back()`; Cancel just `router.back()`.

- [ ] **Step 1: Implement the quick-add sheet**

`apps/mobile/app/add.tsx`:
```tsx
import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCoastStore } from '../src/store/store';
import { parseAddParams, buildTransaction } from '../src/store/addEntry';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Money } from '../src/design/primitives/Money';
import { PillButton } from '../src/design/primitives/PillButton';
import { theme } from '../src/design/theme';

export default function AddEntry() {
  const params = useLocalSearchParams<{ amount?: string; category?: string; note?: string; merchant?: string }>();
  const router = useRouter();
  const data = useCoastStore((s) => s.data);
  const addTransaction = useCoastStore((s) => s.addTransaction);

  const [amount, setAmount] = useState(params.amount ?? '');
  const [note, setNote] = useState(params.note ?? '');
  const [categoryId, setCategoryId] = useState(
    () => parseAddParams({ amount: params.amount, category: params.category, note: params.note, merchant: params.merchant }, data.categories).categoryId,
  );

  const chips = data.categories.filter((c) => c.group === 'discretionary');
  const parsed = parseAddParams({ amount, category: categoryId, note, merchant: params.merchant }, data.categories);

  const onSave = () => {
    const now = new Date();
    const dateIso = now.toISOString().slice(0, 10);
    const id = `t_${now.getTime()}`;
    addTransaction(buildTransaction(parsed, dateIso, id));
    router.back();
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <Pressable onPress={() => router.back()}><AppText variant="label" muted>Cancel</AppText></Pressable>
        <AppText variant="label" muted>NEW ENTRY</AppText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>AMOUNT</AppText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.textMuted}
          style={{ fontFamily: theme.type.hero.family, fontSize: theme.type.hero.size, color: theme.text, paddingVertical: theme.space.sm }}
        />
        <AppText variant="body" muted>That's <Money pence={parsed.amount} variant="body" /></AppText>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>CATEGORY</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.sm }}>
          {chips.map((c) => {
            const selected = c.id === categoryId;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={{ borderRadius: theme.radius.pill, paddingVertical: theme.space.sm, paddingHorizontal: theme.space.lg, backgroundColor: selected ? theme.text : theme.card }}
              >
                <AppText variant="label" style={{ color: selected ? theme.onDark : theme.text }}>{c.name}</AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>NOTE</AppText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional"
          placeholderTextColor={theme.textMuted}
          style={{ fontFamily: theme.type.body.family, fontSize: theme.type.body.size, color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.sm }}
        />

        <View style={{ marginTop: theme.space.xxl }}>
          <PillButton label="SAVE ENTRY" onPress={onSave} />
        </View>
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
git add apps/mobile/app/add.tsx
git commit -m "feat(mobile): quick-add sheet route (form + save, prefilled from params)"
```

---

## Task 3: Wire the Home FAB → /add and verify the deep link

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx` (FAB `onPress` → `router.push('/add')`, drop the `Alert`)
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- Consumes: `useRouter` from expo-router in Home.

- [ ] **Step 1: Rewire the FAB**

In `apps/mobile/app/(tabs)/index.tsx`:
- Add `import { useRouter } from 'expo-router';` and remove `Alert` from the `react-native` import if it's now unused.
- Inside `Home`, add `const router = useRouter();`.
- Change the FAB to: `<Fab onPress={() => router.push('/add')} />`.
Leave the rest of Home unchanged.

- [ ] **Step 2: Verify bundle + typecheck, and confirm the deep-link mapping**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds. The `coast` scheme (`app.json`) + the `app/add.tsx` route mean `coast://add?amount=8.13&note=Coffee` resolves to the add route with those params via expo-router linking — record in the report that this is the deep-link contract (runtime deep-link firing is verified on device/simulator, not in the bundle step). Root `npm test` stays green.

- [ ] **Step 3: Commit**

```bash
git add "apps/mobile/app/(tabs)/index.tsx"
git commit -m "feat(mobile): Home FAB opens the quick-add sheet"
```

---

## Task 4: Automate-logging guide (`app/automate.tsx`) + Profile entry point

**Files:**
- Create: `apps/mobile/app/automate.tsx`
- Modify: `apps/mobile/app/(tabs)/profile.tsx` (add an "Automate logging ›" row → `/automate`)
- Modify: `apps/mobile/package.json` (via `npx expo install expo-clipboard`)
- Verify: `tsc --noEmit` + `expo export`

**Interfaces:**
- `automate.tsx` consumes: `useRouter`, `Clipboard` from `expo-clipboard`, primitives (`Screen`, `AppText`, `Card`, `PillButton`), `theme`. Static steps + a copyable `coast://add?amount=&note=` template.

- [ ] **Step 1: Install expo-clipboard**

```bash
cd apps/mobile && npx expo install expo-clipboard
```
Then root `npm install`.

- [ ] **Step 2: Implement the guide**

`apps/mobile/app/automate.tsx`:
```tsx
import { ScrollView, View, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Card } from '../src/design/primitives/Card';
import { PillButton } from '../src/design/primitives/PillButton';
import { theme } from '../src/design/theme';

const TEMPLATE = 'coast://add?amount=[Amount]&note=[Note]';

const STEPS = [
  'Open the Shortcuts app and tap + to create a new shortcut.',
  'Add an "Ask for Input" action for the amount, and another for a note (both optional).',
  'Add an "Open URLs" action and paste the Coast link below, dropping the Ask results into [Amount] and [Note].',
  'Name it "Log in Coast" and add it to your Home Screen or the Action button.',
  'Tapping it opens Coast with the amount pre-filled — just hit Save.',
];

export default function Automate() {
  const router = useRouter();
  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginTop: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>‹ Back</AppText>
      </Pressable>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="title" style={{ marginTop: theme.space.md }}>Automate logging</AppText>
        <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>
          Coast can't read your bank or Apple Pay automatically — Apple doesn't allow it. But an iOS Shortcut can hand a payment straight to Coast in one tap.
        </AppText>

        <View style={{ marginTop: theme.space.xl }}>
          {STEPS.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.lg }}>
              <AppText variant="title" style={{ color: theme.accent, fontSize: 20, lineHeight: 24 }}>{i + 1}</AppText>
              <AppText variant="body" style={{ flex: 1 }}>{s}</AppText>
            </View>
          ))}
        </View>

        <Card>
          <AppText variant="label" muted>COAST LINK</AppText>
          <AppText variant="body" selectable style={{ marginTop: theme.space.sm }}>{TEMPLATE}</AppText>
          <View style={{ marginTop: theme.space.lg }}>
            <PillButton label="COPY LINK" onPress={() => Clipboard.setStringAsync(TEMPLATE)} />
          </View>
        </Card>

        <AppText variant="body" muted style={{ marginTop: theme.space.xl }}>
          Tip: iOS can also run a shortcut automatically when you pay with a chosen card (Shortcuts → Automation → Transaction). Depending on your iOS version it may still ask you to type the amount.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 3: Add the Profile entry point**

In `apps/mobile/app/(tabs)/profile.tsx`, after the receipt-hint line (near the end of the `ScrollView`), add a pressable row:
```tsx
<Pressable onPress={() => router.push('/automate')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
  <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Automate logging</AppText>
  <AppText variant="title" style={{ color: theme.accent }}>›</AppText>
</Pressable>
```
`profile.tsx` currently imports `{ Alert, ScrollView, View }` from `react-native` — you MUST add `Pressable` to that import. `router` (from `useRouter`) already exists in the file.

- [ ] **Step 4: Verify bundle + typecheck**

```bash
cd apps/mobile && npx tsc --noEmit && npx expo export --platform ios --output-dir /tmp/coast-export
```
Expected: 0 errors; bundle succeeds (expo-clipboard resolves). Root `npm test` stays green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/automate.tsx "apps/mobile/app/(tabs)/profile.tsx" apps/mobile/package.json package-lock.json
git commit -m "feat(mobile): automate-logging guide + Profile entry point"
```

---

## Post-plan acceptance (controller, not a subagent task)

After Task 4, the controller launches the app in the iOS Simulator (or documents deferral) and confirms: the Home `+` opens the quick-add sheet; typing an amount, picking a category, and Save adds a row that appears in Home "Recent" and Activity; opening `coast://add?amount=8.13&note=Coffee` (via `xcrun simctl openurl booted "coast://add?amount=8.13&note=Coffee"`) opens the sheet pre-filled; Profile "Automate logging" opens the guide and "Copy link" works. If no simulator is available, the `expo export` bundle + `tsc` + Jest suites stand as automated acceptance, deferred to the user's machine (the deep-link `openurl` test is the one item that truly needs a running simulator/device).

## Self-Review

**Spec coverage (design spec §8 recording, quick-add + Shortcut slice):**
- Fast manual quick-add (amount + category + note + save) → Task 2 (+ parser T1); FAB entry → Task 3.
- Shortcut / deep-link intake (`coast://add`) → Task 2's route + Task 3's scheme mapping; pre-filled confirm-sheet behaviour (safe, no silent write).
- In-app automate guide + copyable template → Task 4.
- CSV import → Plan 4c; onboarding → Plan 4b (out of scope here).

**Placeholder scan:** No TBD/TODO. Pure parser (T1) is TDD; RN tasks verified by `tsc` + `expo export`; the on-device deep-link fire is explicitly the one runtime-only acceptance item.

**Type consistency check:** `parseAmount`/`categorize`/`CATEGORIES`/`Category`/`Transaction`/`Pence` are real `@coast/core` exports (verified). Store `addTransaction(t: Transaction)` and `data.categories` exist (Plan 2). `parseAddParams`/`buildTransaction`/`AddParams`/`ParsedEntry` names match between `addEntry.ts`, its test, and `add.tsx`. Route params typing (`useLocalSearchParams<{amount?…}>`) matches the deep-link contract `coast://add?amount=&category=&note=&merchant=`. `Transaction` fields (`id, amount, categoryId, date, note?, merchant?, source`) match `packages/core/src/types.ts`; `source: 'manual'` is a valid `EntrySource`. `theme.type.hero.family`/`.size`, `theme.textMuted`, `theme.card`, `theme.onDark` exist in the theme. `expo-clipboard` `Clipboard.setStringAsync` is the correct API.
```
