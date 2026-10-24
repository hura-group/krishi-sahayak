# Achievement Badges

A complete end-to-end badge system for the farming app.

---

## What's included

| Layer | File | Purpose |
|---|---|---|
| **DB** | `supabase/migrations/20260515_000001_create_badges.sql` | Tables, RLS, Realtime, seed data |
| **Edge Function** | `supabase/functions/award-badge/index.ts` | Criteria checks, award, XP, push notification |
| **Hook** | `hooks/useBadges.js` | Fetch + live-sync all badges for the current user |
| **Hook** | `hooks/useBadgeNotification.js` | Listen for new awards → trigger modal |
| **Util** | `utils/badgeChecker.js` | One wrapper per action → calls Edge Function |
| **Component** | `components/BadgeGrid.jsx` | Profile screen grid with filter tabs |
| **Component** | `components/BadgeCard.jsx` | Individual earned/locked badge tile |
| **Component** | `components/BadgeEarnedModal.jsx` | Celebration modal (auto-dismiss, XP chip) |
| **Component** | `components/ConfettiOverlay.jsx` | Canvas confetti animation |
| **Constants** | `constants/badgeDefinitions.js` | All 15 badge definitions |

---

## The 15 Badges

| # | Badge | Category | XP | Unlock condition |
|---|---|---|---|---|
| 1 | First Scan | Farming | 50 | Complete 1 crop scan |
| 2 | Market Watcher | Market | 75 | View market prices 10 times |
| 3 | Community Champion | Social | 100 | Post 5 times in community |
| 4 | Green Streak | Milestone | 80 | 7-day login streak |
| 5 | Top Seller | Market | 60 | List 1 product for sale |
| 6 | Early Bird | Milestone | 200 | Join within first 30 days of launch |
| 7 | Knowledge Seeker | Learning | 90 | Read 10 articles / tips |
| 8 | Weather Wise | Farming | 50 | Check weather 5 times |
| 9 | Harvest Hero | Farming | 100 | Log first harvest |
| 10 | Price Prophet | Market | 150 | Sell within 10% of predicted peak |
| 11 | Social Butterfly | Social | 120 | Connect with 10 farmers |
| 12 | Crop Master | Farming | 110 | Add 5 different crops |
| 13 | Digital Farmer | Milestone | 75 | Complete profile 100% |
| 14 | Milestone Maker | Milestone | 200 | Earn 1,000 total XP |
| 15 | Legend | Milestone | 500 | Reach Top 10 on leaderboard |

---

## Setup

### 1. Run the migration
```bash
supabase db push
# or
supabase migration up
```

### 2. Deploy the Edge Function
```bash
supabase functions deploy award-badge
```

### 3. Set Edge Function secrets
```bash
supabase secrets set \
  FCM_SERVER_KEY="your-fcm-server-key" \
  APP_LAUNCH_DATE="2026-04-15"
```

### 4. Add Tabler Icons CSS
```html
<!-- in your HTML entry point -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
```
Or via npm:
```bash
npm install @tabler/icons-webfont
```
```js
import "@tabler/icons-webfont/tabler-icons.css";
```

---

## Integration

### Mount the notification listener at app root
```jsx
// App.jsx or _layout.jsx
import { BadgeEarnedModal, useBadgeNotification } from "@/features/Badges";

export default function App() {
  const { pendingBadge, dismissBadge } = useBadgeNotification();

  return (
    <>
      <AppRoutes />
      {pendingBadge && (
        <BadgeEarnedModal badge={pendingBadge} onDismiss={dismissBadge} />
      )}
    </>
  );
}
```

### Display the badge grid in ProfileScreen
```jsx
import { BadgeGrid, useBadges } from "@/features/Badges";

export default function ProfileScreen() {
  const { badges, earnedCount, isLoading, error } = useBadges();

  return (
    <ScrollView>
      {/* ...other profile sections... */}
      <BadgeGrid
        badges={badges}
        earnedCount={earnedCount}
        isLoading={isLoading}
        error={error}
      />
    </ScrollView>
  );
}
```

### Trigger a badge check after a user action
```js
import { onScanCompleted, onSaleCompleted } from "@/features/Badges";

// After scan
await scanCrop(image);
await onScanCompleted();          // fire and forget — safe

// After sale (with price data for Price Prophet badge)
await confirmSale(orderId);
await onSaleCompleted({ salePrice: 2450, predictedPeak: 2500 });
```

---

## DB tables assumed to exist

The Edge Function queries these tables — ensure they exist in your schema:

| Table | Relevant column |
|---|---|
| `user_profiles` | `current_streak`, `total_xp`, `profile_completeness` |
| `scan_logs` | `user_id` |
| `market_view_logs` | `user_id` |
| `community_posts` | `user_id` |
| `product_listings` | `user_id` |
| `article_read_logs` | `user_id` |
| `weather_check_logs` | `user_id` |
| `harvest_logs` | `user_id` |
| `farmer_connections` | `user_id`, `connected_user_id` |
| `user_crops` | `user_id`, `crop_type` |
| `push_tokens` | `user_id`, `token` |

---

## Architecture notes

- **Badge criteria live in the Edge Function** (server-side) — clients cannot
  spoof a badge award by calling the DB directly. RLS blocks direct inserts.
- **Realtime** on `user_badges` drives the modal + confetti instantly, even
  if the award was triggered from another device.
- **Queue in `useBadgeNotification`** — if two badges are awarded in one
  action, the modal plays them sequentially, never overlapping.
- **Idempotent awards** — the `UNIQUE (user_id, badge_id)` constraint plus
  `ON CONFLICT` handling in the Edge Function make re-triggers safe.
- **XP is awarded atomically** via the `increment_user_xp` RPC (`SECURITY DEFINER`)
  immediately after the badge row is inserted.

---

## File structure

```
src/features/Badges/
├── index.js
├── README.md
├── components/
│   ├── BadgeCard.jsx
│   ├── BadgeEarnedModal.jsx
│   ├── BadgeGrid.jsx
│   └── ConfettiOverlay.jsx
├── constants/
│   └── badgeDefinitions.js
├── hooks/
│   ├── useBadges.js
│   └── useBadgeNotification.js
└── utils/
    └── badgeChecker.js

supabase/
├── migrations/
│   └── 20260515_000001_create_badges.sql
└── functions/
    └── award-badge/
        └── index.ts
```
