# Coast — Design Spec

**Date:** 2026-08-09
**Status:** Approved for planning
**Repo:** `snig-17/coast` (public)
**Local:** `/Users/snigdhatiwari/Coast`

## 1. Summary

Coast is a calm personal-finance app that answers one question well: **"how much can I
safely spend today, without touching what's protected?"** It runs cross-platform (iOS +
Android) from a single Expo / React Native + TypeScript codebase, entirely **on-device**
with **local storage** — no accounts, no server, no bank connection. A pure, unit-tested
TypeScript finance engine drives every derived figure, so adding data recomputes the whole
picture live and persists between launches.

Coast is an original product in the "safe-to-spend / weekly-ritual" budgeting category. It
is **not** a clone of any existing app; it has its own name, branding, voice, and palette.

## 2. Brand

- **Name:** Coast — "you're on pace, coasting to payday."
- **Voice:** calm, plain-spoken, a little witty. Never shames the user. Protects "joy"
  spending rather than scolding it.
- **Look:** warm sand paper (cream), heavy grotesque numerals, one confident accent —
  **deep coastal teal** — with support colours for category dots. Generous whitespace,
  pill buttons, a weekly "statement" ritual, dark bottom tab bar.
- **Palette (proposed, tweakable):** sand `#E9E4D8`; card `#F2EEE4`; ink `#1A1A1A`;
  accent teal `#0F6E6E`; category dots — Lifestyle teal, Bills ink/black, Savings green
  `#2E7D5B`, Debt amber `#D98A3D`, Joy coral `#E4694E`.
- **Type:** a bundled free heavy grotesque (e.g. an Archivo / Space Grotesk weight from
  Google Fonts) for numerals and headers; a clean sans for body.

## 3. Goals / Non-goals

**Goals**
- Cross-platform (iOS + Android) from one Expo codebase, store-ready.
- First-launch onboarding that builds the user's plan from their own numbers.
- Five core surfaces + the Weekly Statement flow (see §7).
- Honest transaction recording: CSV import (Amex/Revolut) + fast manual entry + Shortcut.
- Separated, unit-tested finance engine (pay cycle, spend room, cycle summary, plan
  breakdown, leaks, weekly-statement builder).
- **Product polish** (the chosen "make it bigger" direction): marketing landing page,
  refined onboarding, reminders/notifications, home-screen widgets.
- Runs on a real phone instantly via Expo Go; builds for both stores via EAS.

**Non-goals (explicit, agreed with user)**
- **No automatic transaction capture.** Apple Wallet exposes no raw transaction data to
  third-party apps (PassKit only creates/adds passes). A live bank feed (open banking)
  requires a registered company, paid API keys, and a server — none possible in a free
  on-device app. CSV import is the closest achievable substitute and is the chosen path.
- No user accounts, cloud sync, or backend (this build).
- Not in scope this build: standalone web app, ML/AI insights & forecasting, deep
  savings-goals system beyond the basic "set aside / receipt" from the core design. (These
  were offered under "make it bigger" and not selected; revisit later.)
- Publishing to the App Store / Play Store needs the user's own Apple Developer account
  ($99/yr) and Google Play account ($25 one-time). The app will be store-ready; those
  accounts are the user's to set up.

## 4. Architecture — Expo monorepo

A pnpm/npm workspaces monorepo so the finance engine is a shared, independently testable
package consumed by the app (and reusable by a future web app).

```
coast/
  package.json            (workspaces root)
  packages/
    engine/               @coast/engine — pure TS finance logic + Jest tests
      src/                payCycle, spendRoom, cycleSummary, planBreakdown,
                          leakDetector, weeklyStatement, money (currency helpers)
      src/__tests__/      unit tests against seeded reference numbers
    core/                 @coast/core — shared models, category catalog, seed data,
                          persistence contract, CSV parsing (platform-agnostic)
  apps/
    mobile/               Expo app (React Native + TypeScript)
      app/                expo-router routes: (tabs)/, onboarding/, statements/, import/
      src/
        design/           theme tokens, typography, fonts, primitives
                          (PillButton, Card, CategoryRow, StatBlock, Donut,
                          ProgressBar, TabBar, SectionHeader)
        store/            Zustand store bound to @coast/engine + persistence
        persistence/      AsyncStorage / expo-file-system JSON store
        features/         home/ activity/ payments/ plan/ profile/ statements/
                          onboarding/ addEntry/ import/
        notifications/    expo-notifications scheduling (reminders)
        widgets/          home-screen widget bridge (see §9)
  landing/                marketing landing page (static site)
  docs/
```

**Data flow:** the Zustand store holds raw model arrays and derives values by calling
`@coast/engine` pure functions. Mutations (add transaction, add payment, stamp statement,
finish onboarding) update arrays and persist to a local JSON blob. On launch the store
hydrates from storage, or falls back to seed data if onboarding is incomplete.

## 5. Finance engine (`@coast/engine`, pure + tested)

- **payCycle(paydayDom, ref)** → current cycle `[start, end)` + `daysUntilPayday`.
  Seed: 31 Jul → 30 Aug 2026, ref Sun 9 Aug 2026, 22 days.
- **spendRoom** → `dailyRoom = max(0, lifestyleRemaining) / daysUntilPayday`. Discretionary
  splits into **Essentials** (monthly-tracked), **Lifestyle** (daily room), **Joy**
  (protected, never a leak). Seed: £178.86 left → £8.13/day.
- **cycleSummary** → spend by top-level group (Lifestyle/Discretionary, Bills & Fixed,
  Savings) with amounts and % of monthly income.
- **planBreakdown** → allocations for the donut: Bills & Fixed £1,520 · Savings £85 ·
  Debt £0 · Discretionary £460 = £2,065.
- **leakDetector** → flags recurring discretionary charges; "closing" one annualises the
  saving into ongoing impact / leaks closed. Seed total £2,860/yr.
- **weeklyStatement(weekStart)** → days under line, planned vs actual spend, leaks spotted,
  money moved forward, Mon–Sun daily ledger, weekly line vs weekly spend, movements,
  result, next daily line, carry in/out. Seed the current week in the "quiet week / £0,
  next daily line £9" state.
- **money** → integer-minor-unit currency helpers (avoid float drift), GBP formatting.

## 6. Data model (`@coast/core`, Codable-style TS types)

`Category` (group + subpool + colour + icon) · `Cadence` (weekly/monthly) · `Transaction`
(amount, category, date, note, source, merchant) · `Payment` (name, amount, cadence,
billingDay, category) · `Income` (monthly, paydayDom) · `BudgetPlan` (group allocations +
discretionary subpool splits) · `Fund` (set-aside pot: name, goal, saved) · `Leak`
(merchant, monthly, annualised, closed) · `Statement` (issueNumber, weekPeriod, issuedDate,
status readyToStamp/stamped).

## 7. Screens

- **Onboarding** (first launch, re-runnable): income + payday → essentials (amount +
  categories, weekly/monthly) → extras (weekly/monthly) → optional savings & debt. Writes
  a real BudgetPlan + Income; until then the demo seed keeps the app alive.
- **Home** — "Today you can spend" hero (spend room), left-until-payday, on-pace status,
  bills-protected note, spent-today progress, until-payday dots + days left, Set aside row,
  Your leaks row, Recent list, accent `+` FAB → quick add.
- **Activity** — cycle navigator, "Spent this cycle" hero + % of income, category rows with
  progress + expand, transactions list / empty state.
- **Payments** — recurring total, protected / possible savings, add payment, month calendar
  with today + billing markers, upcoming billings.
- **Plan** — Budget/Income toggle, "how your plan works" explainer, donut + legend.
- **Profile** — ongoing impact, leaks closed / member since, Weekly Statement card, latest
  receipt, Settings (re-run onboarding, reminders, import, about).
- **Statements** — statements list + a swipeable multi-page Weekly Statement document
  (Cover / Daily ledger / Money movements / Stamp) with page dots; "Stamp this statement"
  flips status to stamped and persists. Reached from the Profile card.

## 8. Recording (honest, free, on-device)

- **CSV import** (`import/` + parser in `@coast/core`): user exports from Revolut
  (Statements → CSV) or Amex (Statements & Activity → CSV), opens the file via document
  picker / share sheet; parser detects the bank's columns, maps rows to transactions,
  auto-categorises by merchant heuristics, and shows a review screen before commit.
- **Fast manual** — quick-add sheet: amount pad, category chips, date defaults today.
- **Shortcut / share target** — documented near-instant logging entry point (stretch: an
  Expo App Intent / share extension).

## 9. Product polish (chosen "bigger" scope)

- **Landing page** (`landing/`): a static marketing page for Coast — hero, the "safe to
  spend today" promise, the weekly-statement ritual, screenshots, honest "your data stays
  on your phone" note, and a store-badge / email-capture placeholder. Deployable to GitHub
  Pages.
- **Refined onboarding**: progress indicator, friendly copy in Coast's voice, sensible
  defaults, skippable with demo seed.
- **Reminders / notifications** (`expo-notifications`): opt-in local reminders — e.g. a
  gentle "log yesterday" nudge and a weekly "your statement is ready to stamp" ping. Local
  only, no push server.
- **Home-screen widget**: a small widget showing today's spend room + days to payday.
  Implemented via a config-plugin / native widget target (iOS WidgetKit, Android glance)
  reading a shared value the app writes; if native widget wiring proves heavy in Expo Go,
  ship a documented dev-build widget as a follow-up and keep the app fully functional.

## 10. Build, run & test

- Expo (SDK current), TypeScript, expo-router. Run on a real device via **Expo Go** (QR),
  and in the iOS Simulator / Android emulator. Store builds via **EAS Build** (later,
  needs the user's developer accounts).
- **Jest** unit tests for `@coast/engine` (payCycle, spendRoom, cycleSummary,
  planBreakdown, leakDetector, weeklyStatement) against seeded reference numbers.
- CI (GitHub Actions): typecheck + lint + engine tests on push.

## 11. Risks

- **Native widget in Expo** — WidgetKit/Glance need a dev build (not Expo Go); phased as a
  follow-up so the core app isn't blocked.
- **CSV column drift** — Amex/Revolut export formats change; parser is heuristic with a
  review step so mis-parses are caught before commit.
- **Font/pixel fidelity** — bundled grotesque gets us very close to the reference feel;
  not a pixel-for-pixel match of any existing app (nor should it be — Coast is its own brand).
- **Monorepo tooling** — workspace + Metro config for the shared package needs correct
  setup; validated early with a trivial engine import from the app.
