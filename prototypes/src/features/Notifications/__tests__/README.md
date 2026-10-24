# Notification + Settings Tests

Complete test suite for the Notification pipeline, Quiet Hours, Deep Link routing,
Price Alert Edge Function, and Account Deletion anonymisation.

---

## File structure

```
src/
├── features/
│   ├── Notifications/
│   │   ├── constants/
│   │   │   └── notificationTypes.js          ← All type IDs + preference keys
│   │   ├── utils/
│   │   │   ├── notificationFilter.js          ← shouldSendNotification()
│   │   │   ├── quietHours.js                  ← IST-aware quiet window logic
│   │   │   └── deepLinkRouter.js              ← notification payload → screen route
│   │   └── __tests__/
│   │       ├── helpers/
│   │       │   └── mockHelpers.js             ← FCM mock, nav mock, data factories
│   │       ├── unit/
│   │       │   ├── notificationPreferenceFilter.test.js
│   │       │   └── quietHours.test.js
│   │       └── integration/
│   │           ├── priceAlertFlow.test.js
│   │           └── deepLinkNavigation.test.js
│   │
│   └── Account/
│       ├── utils/
│       │   └── accountDeletion.js             ← anonymiseUserAccount() + verify
│       └── __tests__/
│           └── integration/
│               └── accountDeletion.test.js

supabase/
└── functions/
    └── price-alert/
        └── index.ts                           ← Deno Edge Function
```

---

## Install dependencies

```bash
# Test runner + coverage
npm install -D vitest @vitest/coverage-v8 @testing-library/jest-dom

# UUID for test factories
npm install uuid

# Supabase client (if not already installed)
npm install @supabase/supabase-js
```

---

## Run tests

### Unit only — no DB required, safe for CI

```bash
npx vitest run src/features/Notifications/__tests__/unit
```

### Integration — requires local Supabase

```bash
# 1. Start local Supabase
npx supabase start

# 2. Copy env template and fill in values from `supabase status`
cp .env.test.example .env.test

# 3. Run integration tests
SUPABASE_TEST_URL=http://localhost:54321 \
SUPABASE_TEST_SERVICE_ROLE_KEY=your-service-role-key \
npx vitest run src/features/Notifications/__tests__/integration \
              src/features/Account/__tests__/integration
```

### All tests + coverage report

```bash
npx vitest run --coverage
# Open coverage/index.html to view the report
```

### Watch mode (dev)

```bash
npx vitest src/features/Notifications src/features/Account
```

---

## Test inventory

### Unit tests (no DB — always pass in CI)

| File | Cases | What it proves |
|---|---|---|
| `notificationPreferenceFilter.test.js` | 16 | Every notification type is blocked/allowed correctly; `all_disabled` kill-switch; SYSTEM bypass; unknown types; empty preferences; batch filter |
| `quietHours.test.js` | 17 | IST midnight-spanning window (22:00–07:00); boundary conditions (start inclusive, end exclusive); UTC vs IST same timestamp; SYSTEM/urgent bypass; custom same-day windows |

### Integration tests (require `npx supabase start`)

| File | Pure cases | DB cases | What it proves |
|---|---|---|---|
| `priceAlertFlow.test.js` | 10 | 4 | Threshold crossing logic; FCM payload shape; Edge Function 200 response; `notification_logs` created; `skipped_preference` recorded |
| `deepLinkNavigation.test.js` | 18 | 0 | All 8 notification types → correct screen + params; URL scheme parsing; universal links; malformed URLs; `navigate()` called exactly once |
| `accountDeletion.test.js` | 6 | 13 | `makeAnonUserId` properties; PII tables deleted; profile nulled; community posts anonymised; aggregate rows re-keyed to anonId; `verifyAnonymisation()` returns zero violations; idempotent |

**Total: 69 assertions across 5 files.**

---

## What each source utility does

### `notificationFilter.js` — `shouldSendNotification(notification, preferences)`

Gate function called before every FCM send. Returns `{ shouldSend, reason }`.

Rules (in order):
1. `type === "system"` → always send
2. `all_disabled === true` → never send
3. Check `preferences[TYPE_TO_PREFERENCE_KEY[type]]` → send if truthy
4. Unknown type → default send (forward-compatible)

### `quietHours.js` — `isInQuietHours(now, start, end, timezone)`

Correctly handles windows that **span midnight** (e.g. 22:00–07:00 IST).

Key IST facts:
- UTC+5:30 · No DST · Stable year-round
- `UTC 16:30 = IST 22:00` (quiet start)
- `UTC 18:30 = IST 00:00` (midnight — deepest quiet)
- `UTC 01:30 = IST 07:00` (quiet end — **not** quiet at this exact minute)

End boundary is **exclusive**: `[start, end)`.

### `deepLinkRouter.js` — `getDeepLinkDestination(notification)`

Maps notification payloads to React Navigation `{ screen, params }` objects.
Also handles `kisansathi://` URL scheme via `parseDeepLinkUrl(url)`.

| Type | Screen | Key params |
|---|---|---|
| `price_alert` | Market | `crop`, `cropId`, `mandiId` |
| `badge_earned` | Profile | `scrollTo: "badges"`, `highlightBadgeId` |
| `community_reply` | CommunityPost | `postId`, `replyId` |
| `leaderboard_change` | Leaderboard | `tab` |
| `weekly_summary` | Leaderboard | `tab: "weekly"` |
| `streak_reminder` | Home | `highlight: "streak"` |
| `system` / unknown | Home | — |

### `accountDeletion.js` — `anonymiseUserAccount(supabase, userId)`

Runs a **best-effort** 14-step pipeline:
- **Delete** PII tables: `push_tokens`, `scan_logs`, `weather_check_logs`, `article_read_logs`, `market_view_logs`, `farmer_connections`, `user_crops`, `harvest_logs`
- **Anonymise** `user_profiles`: name → "Deleted User", phone/email/avatar/location → null
- **Anonymise** `community_posts`: `author_name` → "Deleted User"
- **Soft-delete** `product_listings`: `is_deleted = true`, `seller_name` → "Deleted User"
- **Re-key** aggregate rows (`xp_events`, `user_badges`, `weekly_xp_snapshots`): `user_id` → deterministic `anonId`
- **Delete** from `auth.users` (always last)

One table failing never aborts the rest. Returns a `DeletionReport` with `tablesDeleted`, `tablesAnonymised`, and `errors`.

### `price-alert/index.ts` — Supabase Edge Function

Triggered by a Database Webhook on `commodity_prices INSERT`.

Flow:
1. Parse new price record from webhook payload
2. Find users with active alerts for this commodity whose threshold is crossed
3. Filter by `price_alerts` preference
4. Filter by quiet hours
5. Send FCM notification
6. Write row to `notification_logs` with status (`sent` / `skipped_*` / `fcm_failed`)

**Deploy:**
```bash
supabase functions deploy price-alert
supabase secrets set FCM_SERVER_KEY="your-fcm-server-key"
```

**Webhook config** (Supabase Dashboard → Database → Webhooks):
```
Table:  commodity_prices
Event:  INSERT
Method: POST
URL:    https://<project>.supabase.co/functions/v1/price-alert
```

---

## Test helpers (`mockHelpers.js`)

### `createFCMMock()`
Intercepts `fetch()` calls to `fcm.googleapis.com`. Records every call.

```js
const fcm = createFCMMock();
global.fetch = fcm.fetch;

// After code runs:
expect(fcm.calls).toHaveLength(1);
expect(fcm.calls[0].data.type).toBe("price_alert");
fcm.failNext(); // make the next FCM call return non-ok
```

### `createNavigationMock()`
Records every `navigate(screen, params)` call.

```js
const nav = createNavigationMock();
nav.navigate("Market", { crop: "wheat" });
expect(nav.lastCall()).toEqual({ screen: "Market", params: { crop: "wheat" } });
```

### `istTimeToUTC(istTime)`
Converts `"HH:MM"` IST string to a UTC `Date` — essential for quiet hours tests.

```js
istTimeToUTC("23:30")  // → Date representing 23:30 IST = 18:00 UTC
istTimeToUTC("07:00")  // → Date representing 07:00 IST = 01:30 UTC
```

---

## DB tables required for integration tests

| Table | Used by |
|---|---|
| `user_profiles` | All integration tests |
| `push_tokens` | priceAlertFlow, accountDeletion |
| `price_alerts` | priceAlertFlow |
| `user_notification_preferences` | priceAlertFlow |
| `notification_logs` | priceAlertFlow |
| `commodity_prices` | priceAlertFlow (via Edge Function) |
| `community_posts` | accountDeletion |
| `product_listings` | accountDeletion |
| `xp_events` | accountDeletion |
| `user_badges` | accountDeletion |
| `weekly_xp_snapshots` | accountDeletion |
| `scan_logs`, `weather_check_logs` | accountDeletion |

---

## GitHub Actions CI snippet

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
      - run: npx vitest run --coverage
              src/features/Notifications/__tests__/unit
        name: Run unit tests (no DB)
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: supabase db push
      - run: supabase functions deploy price-alert
      - run: npx vitest run
              src/features/Notifications/__tests__/integration
              src/features/Account/__tests__/integration
        env:
          SUPABASE_TEST_URL: http://localhost:54321
          SUPABASE_TEST_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_SERVICE_KEY }}
```

---

## Quick dev reset

To re-run account deletion tests with fresh data:
```js
// In your test or dev menu:
await testSupabase.from("user_profiles").delete().like("user_id", "test-del-%");
```
