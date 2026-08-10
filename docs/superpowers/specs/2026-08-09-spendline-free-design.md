# Spendline (Free) — Design Spec

**Date:** 2026-08-09
**Status:** Approved for planning
**Location:** `/Users/snigdhatiwari/Spendline`

## 1. Summary

A native SwiftUI iOS app that recreates the look and daily-use behaviour of Spendline
(a personal-finance / safe-to-spend app), running entirely **on-device** with **local
storage** — no accounts, no server, no bank connection. The app is driven by a pure,
unit-tested finance engine so that adding data recomputes every derived figure live and
persists between launches.

The build targets fidelity to seven reference screenshots supplied by the user: Home
(Spend Room), Activity, Payments, Plan, Profile, and the 4-page Weekly Invoice flow.

## 2. Goals / Non-goals

**Goals**
- Faithful recreation of Spendline's visual identity and five tabs.
- A first-launch onboarding wizard that builds the user's plan from their own numbers.
- The Weekly Invoice feature (swipeable 4-page document + invoices list).
- Real, honest transaction recording: CSV import (Amex/Revolut) + fast manual entry.
- A separated, testable finance engine (pay cycle, spend room, cycle summary, donut,
  leaks, weekly-invoice builder).
- Runs and is demonstrated in the iOS Simulator.

**Non-goals (explicit, agreed with user)**
- **No automatic transaction capture.** Apple Wallet exposes no raw transaction data to
  third-party apps (PassKit only creates/adds passes). A live bank feed (open banking)
  requires a registered company, paid API keys, and a server — none possible in a free
  on-device app. CSV import is the closest achievable substitute and is the chosen path.
- No user accounts, cloud sync, or backend.
- No pixel-perfect custom typeface (custom face approximated with system fonts).

## 3. Architecture

**SwiftUI + `@Observable` store persisted to a local JSON file**, with a pure-function
finance engine kept separate from the UI. (SwiftData was considered and rejected: extra
simulator quirks and hidden state for little benefit at this scale; a Codable store is
predictable, easy to seed, and lets the money math be unit-tested directly.)

```
Spendline/
  App/            SpendlineApp, RootTabView
  DesignSystem/   Theme (palette, type, spacing), PillButton, CategoryRow,
                  StatBlock, DonutChart, ProgressBar, BottomTabBar, SectionHeader
  Models/         Transaction, Payment, Income, BudgetPlan, Fund, Leak, Invoice,
                  Category, Cadence
  Store/          SpendlineStore (@Observable), Persistence (JSON file), SeedData
  Engine/         PayCycle, SpendRoom, CycleSummary, LeakDetector, WeeklyInvoiceBuilder
                  (all pure functions / value types)
  Features/
    Onboarding/   OnboardingFlow (income, essentials, extras, savings/debt)
    Home/         HomeView (Spend Room, payday tracker, set aside, leaks, recent, FAB)
    Activity/     ActivityView (pay-cycle categories + transactions)
    Payments/     PaymentsView (recurring total, calendar, add payment)
    Plan/         PlanView (Budget/Income toggle + donut)
    Profile/      ProfileView (impact, leaks closed, weekly-statement card, receipts)
    Invoices/     InvoicesListView, WeeklyInvoiceView (paged 4-page document)
    AddEntry/     QuickAddSheet (fast manual entry)
    Import/       CSVImportView + CSVParser (Amex / Revolut)
  Tests/          EngineTests (XCTest)
```

**Data flow:** Views read derived values from `SpendlineStore`, which holds raw model
arrays and exposes computed properties by calling the pure engine functions. Mutations
(add transaction, add payment, stamp invoice, complete onboarding) update the arrays and
call `persist()`. On launch the store loads the JSON file, or falls back to `SeedData`
(the demo state matching the screenshots) if onboarding has not been completed.

## 4. Finance engine (pure, testable)

- **PayCycle** — given payday day-of-month and a reference date, returns the current
  cycle `[start, end)` and `daysUntilPayday`. Seed: cycle 31 Jul → 30 Aug 2026, ref date
  Sun 9 Aug 2026, 22 days to payday.
- **SpendRoom** — `dailyRoom = max(0, lifestyleRemaining) / daysUntilPayday`. Discretionary
  budget splits into **Essentials** (tracked monthly), **Lifestyle** (drives daily room),
  and **Joy** (protected, never a leak) — matching the "How your plan works" card. Seed so
  it reads £178.86 left → £8.13/day.
- **CycleSummary** — groups spend for the current cycle by top-level category
  (Discretionary, Bills & Fixed, Savings) with amount and % of monthly income → Activity bars.
- **DonutData** — Plan allocations: Bills & Fixed £1,520 · Savings £85 · Debt £0 ·
  Discretionary £460 = £2,065.
- **LeakDetector** — flags recurring discretionary charges; "closing" one annualises the
  saving into Ongoing impact / Leaks closed. Seed leaks total £2,860/yr.
- **WeeklyInvoiceBuilder** — for an ISO week, computes: days under spendline, planned vs
  actual spend, leaks spotted, money moved forward, the Mon–Sun daily ledger (scored / no
  entry), weekly line vs weekly spend, envelope/savings movements, result, next daily
  spendline, carry in/out. Seed W31 (27 Jul–2 Aug, issued Sun 9 Aug) in the "quiet week /
  £0, next daily spendline £9" state from the screenshots.

## 5. Data model (Codable value types)

- `Category` — enum with top-level group (discretionary/bills/savings/debt), display name,
  colour, SF Symbol. Sub-pools for discretionary: essentials / lifestyle / joy.
- `Cadence` — `.weekly` / `.monthly` (used in onboarding for essentials & extras).
- `Transaction` — id, amount, category, date, note, source (manual / import), merchant.
- `Payment` — id, name, amount, cadence, billingDay, category (recurring bills).
- `Income` — monthly amount, paydayDayOfMonth.
- `BudgetPlan` — allocations per top-level group + discretionary sub-pool splits.
- `Fund` — "set aside" pot: name, goal, saved. (Receipt "prints" when saved ≥ goal.)
- `Leak` — merchant, monthlyAmount, annualised, closed flag.
- `Invoice` — issueNumber, weekPeriod, issuedDate, status (`.readyToStamp` / `.stamped`);
  page data derived by `WeeklyInvoiceBuilder`.

## 6. Onboarding wizard

First-launch, re-runnable from Profile. Steps:
1. **Income** — monthly income + payday date.
2. **Essentials** — total + categories, cadence weekly/monthly → Bills & Fixed / Essentials.
3. **Extras** — total + categories, cadence weekly/monthly → Discretionary (Lifestyle/Joy).
4. **Savings & debt** (optional) — monthly targets.
On completion the store writes a real `BudgetPlan` + `Income` and switches off the demo
seed. If skipped, the demo seed (screenshot state) remains so the app still looks alive.

## 7. Screens (matched to screenshots)

- **Home** — "Today's Spend Room" hero, "£X left until payday / on pace / bills protected",
  spent-today progress, until-payday dots + days left, Set aside row, Your leaks row,
  Recent list, red `+` FAB → QuickAddSheet.
- **Activity** — header + weekly-statement mini banner, cycle navigator "31 Jul—30 Aug 2026",
  "Spent this pay cycle" hero + % of income, category rows (Discretionary red / Bills &
  Fixed black / Savings green) with progress + expandable, transactions list / empty state.
- **Payments** — "£1,520/mo recurring", protected / possible savings, "+ Add payment",
  month calendar with today + billing-day markers, Upcoming billings list.
- **Plan** — Budget/Income segmented toggle, "How your plan works" explainer card, donut
  with centre total "AUGUST £2,065" and legend.
- **Profile** — "SPENDLINE / Settings", avatar + name + status, "Ongoing impact +£/yr",
  "Leaks closed" / "Member since", Weekly Statement card ("W31 is ready · Open W31 · All
  statements"), Latest receipt row.
- **Invoices / Weekly Invoice** — Invoices list ("All statements"); a paged
  `TabView(.page)` document with header `‹ Invoices … W31`, page dots, and 4 pages:
  1. Cover (issue no. SPL-W31-2026, period, issued, READY TO STAMP stamp, week-in-view
     circles, headline figures).
  2. Daily ledger (Mon–Sun rows, weekly line / weekly spend).
  3. Money movements ("A quiet week", moved forward).
  4. Stamp (result, next daily spendline £9, carry in/out, black "Stamp this invoice"
     button → status `.stamped`, persisted).

## 8. Recording (honest, free, on-device)

- **CSV import** — `Import/` module. User exports from Revolut (Statements → Excel/CSV)
  or Amex (Statements & Activity → Download CSV) and opens the file into Spendline via the
  share sheet / file picker. `CSVParser` detects Amex vs Revolut column layouts, parses
  rows into `Transaction`s, auto-categorises by merchant heuristics, and shows a review
  screen before committing. Bulk-imports real spending without a server.
- **Fast manual** — `QuickAddSheet`: amount pad, category chips, date default today, 2-tap
  save. Reachable from the Home FAB.
- **iOS Shortcut** — a documented Shortcut / share-sheet entry point for near-instant
  logging (stretch: App Intent).

## 9. Design system

Locked to screenshots: background cream `#E7E3D7`; card cream `#F1EEE4`; accent brick-red
`#C0392B`; text near-black `#1A1A1A`; category dots — Discretionary red, Bills & Fixed
black, Savings green `#2E7D5B`, Debt orange `#D98A3D`. Numerals: heavy grotesque —
approximated with a heavy system rounded / condensed face. Pill buttons, generous spacing,
black 5-icon bottom tab bar (home, activity/chart, card, list, profile).

## 10. Build, run & test

- New Xcode project, iOS 17+, Swift 5.9+, SwiftUI lifecycle. Project generated so it builds
  with `xcodebuild` and launches in the iOS Simulator.
- **XCTest** `EngineTests` covers PayCycle, SpendRoom, CycleSummary, LeakDetector, and
  WeeklyInvoiceBuilder against the seeded reference numbers.
- The app is launched in the Simulator and screenshotted to verify fidelity to the
  reference screens.

## 11. Risks

- **Project generation** — creating a valid `.xcodeproj` non-interactively is the main
  mechanical risk; mitigated by using a minimal known-good project template and validating
  with `xcodebuild` early.
- **Typeface / pixel spacing** — will be very close, not identical (system fonts).
- **CSV column drift** — Amex/Revolut export formats can change; parser is heuristic and
  shows a review step so a mis-parse is caught before commit.
