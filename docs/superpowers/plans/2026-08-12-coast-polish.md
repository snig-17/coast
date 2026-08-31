# Coast In-App Polish Implementation Plan (Plan 5a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the two remaining "arrives in a later update" Alert stubs into real, working screens — **Add Payment** and **Settings** — and tighten a few onboarding/consistency rough edges. Everything here runs in Expo Go with no paid account. (Plan 5's other slices — landing page, local reminders, home-screen widget — are separate and deferred.)

**Architecture:** Follows the established pattern: a pure input→model helper (`src/store/addPayment.ts`, Jest-tested) turns form strings into a `Payment`; two new store actions (`addPayment`, `setProfileName`) commit; two thin screens (`app/add-payment.tsx`, `app/settings.tsx`) drive the UI and reuse existing primitives; entry points swap their `Alert.alert` for `router.push`. Persistence is automatic (the `_layout.tsx` subscription already saves any store change).

**Tech Stack:** Expo + expo-router, React Native, TypeScript strict. Reuses `@coast/core` (`parseAmount`, `Payment`, `Cadence`, `Category`), `expo-constants` (already installed) for the app version in Settings, existing primitives (`Screen`/`AppText`/`Money`/`PillButton`/`SegmentedToggle`). Jest for the pure helper + store actions; `expo export` + `tsc --noEmit` for the screens.

## Global Constraints

- **Reuse, don't rebuild:** amounts via `parseAmount` (pounds→pence); commit via the new store actions; no new finance math. Category pickers reuse `data.categories`.
- **Money is integer pence**, rendered only via `Money`/`formatGBP`.
- **Determinism:** `src/store/addPayment.ts` is pure, inputs only — ids injected. Screens supply the clock/id.
- **No hardcoded style values** in components (theme tokens; brief intrinsics allowed). Thin screens. TS strict. Root `npm test` + `cd apps/mobile && npx tsc --noEmit` clean. Pure helper + store actions are Jest TDD; screens verified by `tsc` + `expo export`.
- **Payment model (fixed):** `Payment { id, name, amount, cadence, billingDay, categoryId }`. `billingDay` clamped to 1..31; `name` trimmed; `amount` from `parseAmount`. Default category = first `bills`-group category (`rent`).

## Scope note

Plan 5a = Add Payment + Settings + minor onboarding/consistency polish. NOT in scope: editing/deleting existing payments (add only), a funds list screen, notifications, widget, landing page. Reset in Settings reuses the existing `reset()` store action (restores the demo seed) behind a confirm.

## File structure

```
apps/mobile/
  src/store/
    addPayment.ts          # buildPayment, isValidPayment  (pure)
    store.ts               # + addPayment(p), setProfileName(name)
  src/__tests__/
    addPayment.test.ts
    store.test.ts          # + addPayment / setProfileName coverage
  app/
    add-payment.tsx        # form -> addPayment -> back
    settings.tsx           # name edit + reset (confirm) + about/version
    (tabs)/
      payments.tsx         # "+ ADD PAYMENT" -> /add-payment (was Alert)
      profile.tsx          # "Settings" -> /settings (was Alert); drop dead "See all"
    onboarding.tsx         # review step shows payday
```

---

## Task 1: Pure payment builder + store actions

**Files:**
- Create: `apps/mobile/src/store/addPayment.ts`, `apps/mobile/src/__tests__/addPayment.test.ts`
- Modify: `apps/mobile/src/store/store.ts`, `apps/mobile/src/__tests__/store.test.ts`

**Interfaces:**
- Produces: `interface PaymentInput { name: string; amount: string; billingDay: string; cadence: Cadence; categoryId: string }`; `isValidPayment(input: PaymentInput): boolean`; `buildPayment(input: PaymentInput, id: string): Payment`.
- Store: `addPayment(p: Payment): void` (prepend); `setProfileName(name: string): void`.

- [ ] **Step 1: Failing tests.**
  - `addPayment.test.ts`: `buildPayment` trims name, parses amount to pence, clamps `billingDay` ('45'→31, '0'→1, 'x'→1), passes cadence/categoryId, uses the given id. `isValidPayment` false for empty/whitespace name or amount ≤ 0, true otherwise.
  - `store.test.ts`: `addPayment(p)` prepends (new `payments[0].id === p.id`, length+1); `setProfileName('Sam')` sets `data.profileName`.
- [ ] **Step 2: Implement** `addPayment.ts` + the two store actions.
- [ ] **Step 3: Verify** `npx jest addPayment store` green; `npx tsc --noEmit` clean.

---

## Task 2: Add Payment screen

**Files:**
- Create: `apps/mobile/app/add-payment.tsx`
- Modify: `apps/mobile/app/(tabs)/payments.tsx`

- [ ] **Step 1: Implement** `add-payment.tsx`: header (Cancel/‑NEW PAYMENT‑/spacer); fields — name (`TextInput`), amount (decimal-pad, live `Money` echo), billing day (number-pad), cadence (`SegmentedToggle` Weekly/Monthly), category chips from `data.categories` filtered to `bills`/`savings`/`debt` groups (default `rent`); `PillButton "SAVE PAYMENT"` disabled (opacity 0.4) until `isValidPayment`; on save `addPayment(buildPayment(input, `pay_${Date.now()}`))` then `router.back()`. Theme tokens only.
- [ ] **Step 2:** In `payments.tsx`, replace the `Alert.alert(...)` with `router.push('/add-payment')` (add `useRouter`); drop the now-unused `Alert` import.
- [ ] **Step 3: Verify** `npx tsc --noEmit` clean; `npx expo export --platform ios --output-dir /tmp/coast-export` bundles; remove the dir.

---

## Task 3: Settings screen

**Files:**
- Create: `apps/mobile/app/settings.tsx`
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Implement** `settings.tsx`: header (Cancel/‑SETTINGS‑/spacer); **Display name** — `TextInput` seeded from `data.profileName`, committed via `setProfileName` on a "Save" affordance or onEndEditing (trim; ignore empty); **Redo onboarding ›** row → `/onboarding`; **Reset app data** row → `Alert.alert` confirm (destructive) → `reset()`; **About** — "Coast" + version via `Constants.expoConfig?.version`. Theme tokens only.
- [ ] **Step 2:** In `profile.tsx`, replace the Settings `Alert.alert` with `router.push('/settings')`; remove the dead non-pressable "See all" `AppText` (no funds-list screen exists — keep the honest "LATEST RECEIPT · N SAVED" label + the explanatory line).
- [ ] **Step 3: Verify** `npx tsc --noEmit` clean; `expo export` bundles.

---

## Task 4: Onboarding review polish

**Files:**
- Modify: `apps/mobile/app/onboarding.tsx`

- [ ] **Step 1:** On the review step (step 5), add a "Payday" line to the summary rows showing `day {input.paydayDom}` (so the collected payday is visible before finishing). Keep the existing rows/order; insert Payday under Income.
- [ ] **Step 2: Verify** `npx tsc --noEmit` clean; `expo export` bundles.

---

## Task 5: Full verification + land

- [ ] Root `npm test` all green (new addPayment + store coverage).
- [ ] `cd apps/mobile && npx tsc --noEmit` clean.
- [ ] `npx expo export --platform ios --output-dir /tmp/coast-export` bundles; remove the dir.
- [ ] Update project memory (Plan 5a done; remaining Plan 5 = landing / reminders / widget). Whole-branch Opus review, then merge to `main` + push.
