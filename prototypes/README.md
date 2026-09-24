# Prototypes — Session Deliverables (Not Wired Into the App)

**Read this before using anything in this folder.**

Everything here was built standalone, in a separate Claude session, before
the real `apps/mobile` and `apps/web` source in this repo had been
inspected. None of it is imported by, or connected to, the actual running
app. Treat this folder as a reference library of fully-written, tested
feature implementations to selectively port in — not as a branch you merge
and ship.

## Why this is a separate folder, not a real PR into apps/mobile

A direct code audit (see `qa-sweep/audit-log.md` on the
`qa-sweep/phase-0-audit` branch) found that `apps/mobile` already has its
own, different implementations of several things this folder also builds:

| This folder has | apps/mobile already has | Conflict |
|---|---|---|
| `src/features/OfflineQueue/` — its own WatermelonDB schema (`offline_queue` table) | `src/database/schema.ts` — its own schema (`local_weather`, `local_prices`, `local_news`), plus an existing offline pest-detection queue (commit `7676bf65`) | **Real** — two competing WatermelonDB schemas cannot coexist in one app without a merge |
| `src/features/Notifications/` — its own FCM/quiet-hours/deep-link system | `src/services/notificationService.ts`, `src/services/pushNotificationService.ts` | **Real** — duplicate notification pipelines |
| `src/screens/Leaderboard/`, `src/features/Gamification/`, `src/features/Badges/` | Nothing equivalent found | **None** — net-new functionality, safe to port once reviewed |
| `src/features/RateApp/` | Nothing equivalent found | **None** — net-new |
| `src/components/legal/`, `src/content/legal/` (Privacy/Terms pages) | Nothing equivalent found | **None** — net-new |
| `branding/` (app icon, splash, full platform asset set) | Whatever's currently in `apps/mobile/assets/` (not diffed here) | **Unknown** — check before applying, don't blind-overwrite |

## What's actually in here

```
prototypes/
├── src/
│   ├── screens/Leaderboard/          ← weekly/monthly leaderboard, no conflicts
│   ├── features/Badges/              ← 15-badge system + award logic, no conflicts
│   ├── features/Gamification/        ← XP/streak/tier engine, no conflicts
│   ├── features/RateApp/             ← app store rating prompt flow, no conflicts
│   ├── features/OfflineQueue/        ← CONFLICTS with src/database/schema.ts — see above
│   ├── features/Notifications/       ← CONFLICTS with notificationService.ts — see above
│   ├── features/Account/             ← GDPR account deletion + anonymisation, no conflicts
│   ├── features/Offline/             ← network status banner/toast UI, no conflicts
│   ├── features/Settings/            ← legal links settings section, no conflicts
│   ├── components/legal/             ← Privacy Policy / Terms page components (web)
│   └── content/legal/                ← Privacy Policy / Terms copy
├── branding/                          ← full app icon + splash asset pipeline (SVG source
│                                          + every platform size, generator script included)
├── supabase/                          ← Edge Functions + SQL migrations written for the
│                                          features above — check against the real
│                                          supabase/migrations/ and supabase/ALL_MIGRATIONS.sql
│                                          before applying, these were NOT written against
│                                          the real schema
└── vitest.config.js, .env.test.example
```

Every feature folder has its own README with setup instructions and test
commands, written assuming it's the only thing in the project — adjust
import paths when porting into `apps/mobile`'s real structure (this uses
plain `src/`, the real app is Expo Router with `app/(tabs)/` + `src/`).

## How to actually use this

1. **Don't merge this folder wholesale.** Pick one feature (e.g.
   `src/screens/Leaderboard/`) that has no conflict, read its README, and
   port it into `apps/mobile` by hand — adjusting imports, hooking it into
   the real `(tabs)/` routing, and wiring it to the real Supabase client
   instead of the mock data it currently ships with.
2. **For `OfflineQueue` and `Notifications` specifically:** don't port
   these directly. Use them as a reference for *patterns* (the
   exponential-backoff retry logic, the quiet-hours IST math, the
   last-write-wins conflict resolution) and apply those patterns to the
   real `src/database/schema.ts` and `notificationService.ts` instead of
   introducing a second system.
3. **For `branding/`:** diff `branding/assets/images/icon.png` etc.
   against whatever's currently in `apps/mobile/assets/` before applying —
   this was designed in isolation and may not match an already-chosen
   direction.

## Testing

Each feature's tests are real and runnable in isolation:
```bash
cd prototypes
npm install vitest --no-save
npx vitest run src/features/Gamification/__tests__
npx vitest run src/features/Notifications/__tests__
npx vitest run src/features/Account/__tests__
```
These were verified to pass against the mock data and processors written
alongside them — they do not exercise the real app's Supabase instance or
schema.
