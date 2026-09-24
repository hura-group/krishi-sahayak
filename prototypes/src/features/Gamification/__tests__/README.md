# Gamification Tests

Complete test suite for the Gamification feature — unit and integration.

---

## Quick start

```bash
# Install dependencies (if not done)
npm install

# Run all unit tests (no DB required)
npx vitest run src/features/Gamification/__tests__/unit

# Run with watch mode (dev)
npx vitest src/features/Gamification

# Run with coverage report
npx vitest run --coverage src/features/Gamification

# Run integration tests (requires local Supabase)
npx supabase start
cp .env.test.example .env.test   # fill in your keys
npx vitest run src/features/Gamification/__tests__/integration
```

---

## Test inventory

### Unit tests (no DB — always pass in CI)

| File | Cases | What it proves |
|---|---|---|
| `unit/xpDeduplication.test.js` | 16 | XP events are idempotent; race conditions can't double-count; rank math is correct |
| `unit/streakCalculation.test.js` | 22 | Streak logic is correct in every timezone scenario, especially IST midnight edge cases |
| `unit/badgeConditions.test.js` | 38 | Every badge's award condition is correct at, above, and below threshold |

### Integration tests (require `npx supabase start`)

| File | Cases | What it proves |
|---|---|---|
| `integration/xpFlow.test.js` | 10 | Full DB round-trip: XP grant → total_xp updated → rank RPC returns correct gap |
| `integration/weeklySummary.test.js` | 15 (8 pure + 5 DB) | Copy variants are correct; RPC returns right data; snapshots don't duplicate |

**Total: 101 assertions across 5 files.**

---

## Architecture

```
__tests__/
├── setup.js                        ← Per-file setup (mock reset, localStorage patch)
├── helpers/
│   ├── mockSupabase.js             ← Chainable Supabase mock + DbAdapter mock
│   └── testFactories.js            ← Data factories + real Supabase test client
├── unit/
│   ├── xpDeduplication.test.js
│   ├── streakCalculation.test.js
│   └── badgeConditions.test.js
└── integration/
    ├── xpFlow.test.js
    └── weeklySummary.test.js
```

---

## What each test file covers in detail

### xpDeduplication.test.js
Tests `utils/xpEventProcessor.js`:
- New event → `xp_events` insert + `increment_user_xp` RPC called
- Duplicate eventId → unique violation caught → `skipped: true, reason: "duplicate_event"`
- Zero-XP action → skipped before hitting the DB
- Concurrent fire of same eventId → exactly **1** XP grant via Promise.all
- Unexpected DB errors propagated; RPC failure triggers compensating delete
- `computeRank()` DENSE_RANK semantics: tied users share rank, no gaps
- `xpGapToNextRank()` returns correct gap and triggers "Almost There" condition

### streakCalculation.test.js
Tests `utils/streakUtils.js`:

**Basic logic:**
- First login → streak 1
- Same IST calendar day → unchanged
- +1 IST day → increment
- +2 IST days → reset to 1 (never 0)

**Timezone edge cases (the hard ones):**
- Login at 23:50 IST + login at 00:10 IST (20 min later UTC!) → consecutive ✓
- Login at 18:31 UTC (= 00:01 IST next day) → counts as next day for IST user ✓
- 25-hour gap across IST midnight → consecutive calendar days ✓
- 23-hour gap, same IST calendar day → unchanged ✓
- Same UTC timestamps: IST user increments, UTC user stays the same ✓

**Badge triggers:**
- `meetsGreenStreakThreshold`: true at 7, false at 6
- `streakMilestoneCrossed`: correctly detects 7, 14, 30 crossings

### badgeConditions.test.js
Tests `utils/badgeCriteria.js` — all 15 badges:
- Happy-path award condition for every badge
- One-below-threshold rejection for every countable badge
- **price-prophet**: boundary math at 90%, 95%, 100%, 110%, 89%, 111%
- **crop-master**: 5 distinct vs 5 of same type
- **early-bird**: day 1, day 29, day 30 (award) vs day 31 (reject)
- **legend**: user in top 10 (award) vs 11th (reject)
- **digital-farmer**: exactly 100% vs 99%
- **milestone-maker**: 1000 XP vs 999 XP
- Null/undefined safety: no badge criteria throw on missing data

### xpFlow.test.js (integration)
Tests the full DB round-trip:
- `xp_events` row is actually created with correct metadata
- `total_xp` in `user_profiles` is incremented by the correct amount
- Duplicate eventId does NOT double the DB value
- Concurrent duplicate events: exactly 1 wins (DB-level unique constraint)
- `get_rank_xp_gap` RPC returns correct XP gap
- Tier crossing detected correctly after XP grant
- Full chain: scan → +10 XP → milestone-maker badge awarded via Edge Function

### weeklySummary.test.js (integration)
**Pure layer (always runs):**
- All 4 notification copy variants (rank up 🚀, held ⭐, dropped 💪, first week 🌱)
- `computeWeeklySummary` correctly calculates XP earned and rank change direction
- Users with 0 XP earned are filtered out

**Full integration layer (requires local Supabase):**
- Edge Function returns 200 with correct payload shape
- `get_weekly_summary` RPC returns correct deltas for seeded test users
- Snapshot rows are created after Edge Function call
- Calling twice in the same week does not create duplicate snapshot rows

---

## Running in CI (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx vitest run --coverage src/features/Gamification/__tests__/unit
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  integration-tests:
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/postgres:15
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: supabase db push
      - run: supabase functions deploy award-badge weekly-summary
      - run: npx vitest run src/features/Gamification/__tests__/integration
        env:
          SUPABASE_TEST_URL: http://localhost:54321
          SUPABASE_TEST_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_SERVICE_KEY }}
```

---

## Coverage targets

| Module | Line | Function | Branch |
|---|---|---|---|
| `utils/tierUtils.js` | 95%+ | 100% | 90%+ |
| `utils/streakUtils.js` | 95%+ | 100% | 90%+ |
| `utils/xpEventProcessor.js` | 90%+ | 100% | 85%+ |
| `utils/badgeCriteria.js` | 90%+ | 100% | 85%+ |

Run `npx vitest run --coverage` to see the live report in `coverage/index.html`.

---

## Adding a new badge test

1. Add the criteria function to `utils/badgeCriteria.js`
2. Add a `describe("Badge: <slug>", ...)` block in `badgeConditions.test.js`
3. Test: happy path, one-below threshold, null-safety
4. Run `npx vitest run unit/badgeConditions.test.js`
