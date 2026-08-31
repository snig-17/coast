# Coast CSV Import Implementation Plan (Plan 4c)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user import real spending from an Amex/Revolut CSV export. A document picker reads the file, the already-built core `parseCsv` turns it into rows, a review screen lets the user deselect rows and re-categorise, likely-duplicate rows (already in the app) are flagged and pre-excluded, and committing writes the selected rows as `source: 'import'` transactions. Reachable from Profile and offered as an optional step during onboarding.

**Architecture:** A pure "import session" layer (`src/store/importCsv.ts`, Jest-tested) sits on top of core `parseCsv`: it decorates each parsed row with `include`/`duplicate`/`key`, detects duplicates against existing transactions (date + amount + merchant), and maps the selected rows to `Transaction[]` via an injected id factory (so the module stays deterministic). A single route (`app/import.tsx`) drives the flow: pick file → read text → `buildImportSession` → review list (include toggle + per-row category, read-only amount/date/merchant) → commit via a new bulk store action `addTransactions`. Entry points: a Profile row and an optional link on the onboarding review step.

**Tech Stack:** Expo + expo-router, React Native, TypeScript strict. New Expo modules: `expo-document-picker` (pick the CSV) + `expo-file-system` (read its text). Reuses `@coast/core` (`parseCsv`, `ParsedTransaction`, `BankFormat`, `Transaction`, `Category`, `Pence`) and existing primitives. Jest for the pure module + store action; `expo export` bundle + `tsc --noEmit` for the RN screen.

## Global Constraints

- **Reuse, don't rebuild:** parsing, format detection, date normalisation, outflow filtering, and auto-categorisation are ALL in core `parseCsv` — the mobile layer must not re-implement any of it. It only decorates rows, dedups against the store, and commits.
- **Money is integer pence.** Amounts come straight from `parseCsv` (already pence); never re-parse. Rendered only via `Money`/`formatGBP`.
- **Determinism:** `src/store/importCsv.ts` is pure, inputs only — no `Date.now()`/argless `new Date()`/`Math.random()`. Ids are supplied by an injected `makeId` factory; the screen provides the clock-based factory.
- **No hardcoded style values** in the screen (theme tokens; brief intrinsics allowed). Thin screen. TS strict. Root `npm test` + `cd apps/mobile && npx tsc --noEmit` stay clean. The pure module + store action are Jest TDD; the screen is verified by `tsc` + `expo export`.
- **Duplicate rule (fixed):** a row is a duplicate iff an existing store transaction shares the same `dedupKey = date | amount | merchant.toLowerCase()`. Duplicates are pre-excluded (`include = false`) but remain visible and re-includable. Dedup is against existing store transactions only — identical rows *within* one file are treated as distinct purchases.
- **Commit mapping (fixed):** each included row → `Transaction { id: makeId(row,i), amount, categoryId, date, merchant, source: 'import' }`. No `note`. Rows keep file order and are prepended as one block.

## Scope note

Plan 4c = the import UI + its pure session layer + entry points. It does NOT add new bank formats (core supports Amex + Revolut; `unknown` shows a friendly error), does NOT edit amount/date/merchant per row (category + include only), and does NOT reconcile against payments/leaks. Polish (landing, reminders, widget) is Plan 5.

## File structure

```
apps/mobile/
  src/store/
    importCsv.ts           # buildImportSession, dedupKey, toggleInclude, setRowCategory, summarize, commitRows  (pure)
    store.ts               # + addTransactions(ts) bulk action
  src/__tests__/
    importCsv.test.ts
    store.test.ts          # + addTransactions coverage
  app/
    import.tsx             # pick -> review -> commit
    (tabs)/
      profile.tsx          # add "Import transactions ›" row -> /import
    onboarding.tsx         # optional "Import past transactions" link on the review step -> /import
package.json               # + expo-document-picker, expo-file-system
```

---

## Task 1: Pure import session layer

**Files:**
- Create: `apps/mobile/src/store/importCsv.ts`, `apps/mobile/src/__tests__/importCsv.test.ts`

**Interfaces:**
- Consumes: `@coast/core` (`parseCsv`, `ParsedTransaction`, `BankFormat`, `Transaction`, `Pence`).
- Produces:
  - `interface ImportRow extends ParsedTransaction { key: string; include: boolean; duplicate: boolean }`
  - `interface ImportSession { format: BankFormat; rows: ImportRow[] }`
  - `interface ImportSummary { total: number; included: number; duplicates: number; includedAmount: Pence }`
  - `dedupKey(t: { date: string; amount: Pence; merchant?: string }): string`
  - `buildImportSession(text: string, existing: Transaction[]): ImportSession`
  - `toggleInclude(rows: ImportRow[], key: string): ImportRow[]`
  - `setRowCategory(rows: ImportRow[], key: string, categoryId: string): ImportRow[]`
  - `summarize(rows: ImportRow[]): ImportSummary`
  - `commitRows(rows: ImportRow[], makeId: (r: ImportRow, i: number) => string): Transaction[]`

- [ ] **Step 1: Write the failing test** — `apps/mobile/src/__tests__/importCsv.test.ts`

Cover: (a) `dedupKey` is case-insensitive on merchant and combines date+amount+merchant; (b) `buildImportSession` on a small Amex CSV returns `format:'amex'` and one row per outflow, each with a unique `key`, `include:true`, `duplicate:false` when `existing` is empty; (c) a row matching an existing transaction (same date+amount+merchant) comes back `duplicate:true, include:false` while others stay included; (d) `toggleInclude` flips only the targeted row's `include`, `setRowCategory` changes only the targeted row's `categoryId`, both returning new arrays; (e) `summarize` counts total/included/duplicates and sums `includedAmount` over included rows only; (f) `commitRows` emits only included rows in order, each `source:'import'` with `merchant` set and no `note`, using `makeId`; (g) an `unknown`/empty CSV yields `format:'unknown', rows:[]` and `commitRows` → `[]`.

- [ ] **Step 2: Implement** `src/store/importCsv.ts` to pass. `key = `${i}|${date}|${amount}|${merchant}``. `dedupKey` lowercases merchant and trims. `buildImportSession` builds an existing-key `Set`, marks `duplicate` by membership, `include = !duplicate`. Pure array maps for toggles. `commitRows` filters `include`, maps to `Transaction`.

- [ ] **Step 3: Verify** — `cd apps/mobile && npx jest importCsv` green; `npx tsc --noEmit` clean.

---

## Task 2: Bulk store action

**Files:**
- Modify: `apps/mobile/src/store/store.ts`, `apps/mobile/src/__tests__/store.test.ts`

- [ ] **Step 1: Failing test** — add `addTransactions([a,b])` prepends both as a block preserving order (result `[a, b, ...previous]`); empty array is a no-op.
- [ ] **Step 2: Implement** — add to `CoastStore` interface `addTransactions(ts: Transaction[]): void;` and impl `set({ data: { ...get().data, transactions: [...ts, ...get().data.transactions] } })`.
- [ ] **Step 3: Verify** — `npx jest store` green.

---

## Task 3: Import screen

**Files:**
- Create: `apps/mobile/app/import.tsx`
- Modify: `apps/mobile/package.json` (via `npx expo install expo-document-picker expo-file-system`)

**Behaviour:**
- **Pick:** header (Cancel ‹ / "IMPORT" / spacer) + intro copy ("Export a statement from Amex or Revolut as CSV, then choose the file.") + `PillButton "CHOOSE CSV FILE"` → `DocumentPicker.getDocumentAsync({ type: ['text/csv','text/comma-separated-values','public.comma-separated-values','*/*'] })`. On success read text via `FileSystem.readAsStringAsync(uri)` → `buildImportSession(text, data.transactions)` into state.
- **Unknown/empty:** if `format === 'unknown'` or `rows.length === 0`, show a calm message ("That file didn't look like an Amex or Revolut export.") + "Choose another file". Never crash.
- **Review:** summary line (detected format + `summarize` counts + `Money` of `includedAmount`); scrollable list — each row shows date (via `format` weekday/day helper or ISO), merchant, `Money amount`, a category chip (tap cycles/opens the discretionary+catalog category set like `add.tsx`), and an include checkbox; duplicate rows show a muted "already added" tag and start unchecked. Commit `PillButton "IMPORT N TRANSACTIONS"` (N = included count, disabled at 0) → `addTransactions(commitRows(rows, makeId))` then `router.back()`. `makeId = (r,i) => `imp_${Date.now()}_${i}``.
- Thin screen: all logic from Task 1 helpers; only local state is `session` + re-derived `summary`.

- [ ] **Step 1: Implement** `app/import.tsx` (states: pick / error / review), theme tokens only.
- [ ] **Step 2: Verify** — `npx tsc --noEmit` clean; `npx expo export --platform ios --output-dir /tmp/coast-export` bundles; clean `/tmp/coast-export` after.

---

## Task 4: Entry points (Profile + onboarding)

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/app/onboarding.tsx`

- [ ] **Step 1:** Profile — add an "Import transactions ›" row (matching the existing "Redo onboarding ›"/"Settings" row style) → `router.push('/import')`.
- [ ] **Step 2:** Onboarding — on the review step add a subtle optional link "Import past transactions" → `router.push('/import')` (import commits transactions independently of `completeOnboarding`; returning lands back on onboarding to finish). Keep it visually secondary to the primary finish button.
- [ ] **Step 3: Verify** — `npx tsc --noEmit` clean; `npx expo export ...` bundles.

---

## Task 5: Full verification

- [ ] Root `npm test` all green (new importCsv + store tests included).
- [ ] `cd apps/mobile && npx tsc --noEmit` clean.
- [ ] `npx expo export --platform ios --output-dir /tmp/coast-export` bundles; remove the dir.
- [ ] Update project memory (Plan 4c done; 5 remains). Commit on a `csv-import` branch, whole-branch review, then merge to `main` + push.
