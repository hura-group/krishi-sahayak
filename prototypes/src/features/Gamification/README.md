# Gamification Psychology Hooks

Complete XP tier system, home-screen nudge banners, weekly push recap, and community tier badges.

---

## What's included

| Layer | File | Purpose |
|---|---|---|
| **DB** | `supabase/migrations/20260515_000002_gamification.sql` | Snapshot table, 3 RPCs, pg_cron job |
| **Edge Function** | `supabase/functions/weekly-summary/index.ts` | Weekly push notifications (Monday 00:05 UTC) |
| **Hook** | `hooks/useXPProgress.js` | XP, tier, next-tier, progress — live via Realtime |
| **Hook** | `hooks/useAlmostThere.js` | Rank + tier nudge logic, 24 h dismiss via localStorage |
| **Component** | `components/XPProgressBar.jsx` | Full tier journey bar for profile screen |
| **Component** | `components/AlmostThereBanner.jsx` | Home-screen sticky nudge banner |
| **Component** | `components/Badges.jsx` | `TierBadge` + `TopContributorBadge` |
| **Utils** | `utils/tierUtils.js` | Pure XP ↔ tier calculation functions |
| **Constants** | `constants/tiers.js` | 4 tier definitions + thresholds |

---

## Tier System

| Tier | XP Range | Icon | Key perk |
|---|---|---|---|
| 🌱 Seedling | 0 – 499 | `ti-plant-2` | Full app access |
| 🚜 Farmer | 500 – 1,999 | `ti-tractor` | Advanced market analytics + 2× post reach |
| ⭐ Expert | 2,000 – 4,999 | `ti-award` | Expert badge in community, webinars |
| 👑 Champion | 5,000+ | `ti-crown` | **"Top Contributor"** gold badge, homepage spotlight |

---

## Setup

### 1. Run migration
```bash
supabase db push
```

### 2. Deploy Edge Function
```bash
supabase functions deploy weekly-summary
```

### 3. Set secrets
```bash
supabase secrets set FCM_SERVER_KEY="your-fcm-server-key"
```

### 4. Schedule (if not using pg_cron)
In the Supabase dashboard → Edge Functions → weekly-summary → Schedule: `5 0 * * MON`

---

## Integration

### Home screen — "Almost There" nudge
```jsx
import { AlmostThereBanner, useAlmostThere } from "@/features/Gamification";

export default function HomeScreen() {
  const { nudge, isDismissed, dismiss, recheckNudge } = useAlmostThere();

  // Call recheckNudge() after any XP-earning action
  const handleScan = async () => {
    await doScan();
    recheckNudge();
  };

  return (
    <View>
      {!isDismissed && nudge && (
        <AlmostThereBanner
          nudge={nudge}
          onDismiss={dismiss}
          onEarnXP={() => navigation.navigate("Tasks")}
        />
      )}
      {/* ... rest of home screen */}
    </View>
  );
}
```

### Profile screen — XP progress bar
```jsx
import { XPProgressBar, useXPProgress } from "@/features/Gamification";

export default function ProfileScreen() {
  const progress = useXPProgress();

  return (
    <ScrollView>
      {/* ...other sections... */}
      <XPProgressBar {...progress} />
    </ScrollView>
  );
}
```

### Community post — Tier + Top Contributor badges
```jsx
import { TierBadge, TopContributorBadge, getTierForXP, isChampion } from "@/features/Gamification";

function PostHeader({ author }) {
  const tier     = getTierForXP(author.totalXP);
  const champion = isChampion(author.totalXP);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Avatar uri={author.avatar} />
      <Text style={{ fontWeight: "600" }}>{author.name}</Text>
      <TierBadge tier={tier} size="sm" />
      <TopContributorBadge isChampion={champion} />
    </View>
  );
}
```

---

## Psychology hooks explained

### 1. "Almost There!" rank nudge
- Calls `get_rank_xp_gap()` RPC on mount and after every XP action
- Shows banner if gap to next leaderboard rank ≤ **10 XP**
- Falls back to tier nudge if gap to next tier ≤ **50 XP**
- Dismissed for **24 hours** per device (localStorage)
- Rank nudge always takes priority over tier nudge

### 2. Weekly summary push notification
- Runs every **Monday 00:05 UTC** via pg_cron or Supabase scheduler
- Four copy variants based on rank change direction
- Skips users who earned 0 XP (no spam)
- Snapshots XP + rank for next week's comparison

### 3. XP progress bar (loss aversion + goal gradient)
- Node-based tier journey shows the full path — makes progress visible
- Animated fill on mount (satisfying, not jarring)
- Benefits list for current tier + teaser for next tier ("locked" label)
- Champion state: no loss aversion — pure celebration

### 4. Top Contributor badge (status + social proof)
- Exclusive gold shimmer badge shown only to 5,000+ XP users
- Visible on every community post — drives aspiration in others
- Zero config: just pass `isChampion={true}` to the component

---

## DB objects created

| Object | Type | Purpose |
|---|---|---|
| `weekly_xp_snapshots` | Table | Stores XP + rank at week start per user |
| `get_rank_xp_gap(user_id)` | RPC | Returns XP gap to person ranked above |
| `get_weekly_summary(week_start)` | RPC | Aggregates weekly XP earned + rank delta |
| `weekly_xp_snapshot` | pg_cron job | Auto-snapshots every Monday 00:05 UTC |

---

## File structure

```
src/features/Gamification/
├── index.js
├── README.md
├── constants/
│   └── tiers.js                ← 4 tier defs + XP thresholds
├── utils/
│   └── tierUtils.js            ← pure XP ↔ tier functions
├── hooks/
│   ├── useXPProgress.js        ← XP + derived tier values, Realtime
│   └── useAlmostThere.js       ← nudge logic, 24 h dismiss
└── components/
    ├── AlmostThereBanner.jsx   ← home screen nudge
    ├── XPProgressBar.jsx       ← profile tier journey bar
    └── Badges.jsx              ← TierBadge + TopContributorBadge

supabase/
├── migrations/
│   └── 20260515_000002_gamification.sql
└── functions/
    └── weekly-summary/
        └── index.ts
```
