# Coast

**Calm personal finance.** Coast answers one question well: *how much can I safely spend
today, without touching what's protected?*

- 📱 Cross-platform (iOS + Android) — one Expo / React Native + TypeScript codebase
- 🔒 On-device only — no accounts, no server, your data stays on your phone
- 🧮 A pure, unit-tested finance engine (spend room, pay cycle, weekly statement)
- 🧾 A weekly "statement" ritual you stamp when the week closes
- 📥 Import real spending from Amex / Revolut CSV exports, or add it in two taps

> **Honest note on "automatic" tracking:** Coast can't auto-capture card transactions.
> Apple Wallet exposes no transaction data to third-party apps, and a live bank feed needs
> a registered company, paid API keys, and a server — none of which fit a free, on-device
> app. Coast's answer is fast CSV import + quick manual entry instead.

## Status

Early. Design spec:
[`docs/superpowers/specs/2026-08-09-coast-design.md`](docs/superpowers/specs/2026-08-09-coast-design.md).
Implementation planning next.

## Structure (planned)

```
packages/engine   @coast/engine — pure finance logic + tests
packages/core     @coast/core — models, seed data, CSV parsing
apps/mobile       Expo app
landing           marketing landing page
```

## License

TBD.
