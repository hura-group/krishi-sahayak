# Leaderboard Screen

Ranked farmer leaderboard with weekly/monthly tabs, state filter, and a pinned current-user row.

---

## Quick start

```jsx
import LeaderboardScreen from "@/screens/Leaderboard";

// Development — uses built-in mock data
<LeaderboardScreen />

// Production — pass real API data
<LeaderboardScreen
  weeklyData={weeklyApiData}
  monthlyData={monthlyApiData}
  currentUser={currentUserData}
/>
```

---

## Props

| Prop          | Type           | Default         | Description                              |
|---------------|----------------|-----------------|------------------------------------------|
| `weeklyData`  | `Farmer[]`     | `MOCK_WEEKLY_DATA`  | Weekly farmer rankings (sorted desc by xp) |
| `monthlyData` | `Farmer[]`     | `MOCK_MONTHLY_DATA` | Monthly farmer rankings                  |
| `currentUser` | `CurrentUser`  | `MOCK_CURRENT_USER` | Logged-in user                           |

---

## Data types

```ts
interface Farmer {
  id:     number;
  name:   string;
  state:  string;   // full state name e.g. "Punjab"
  xp:     number;
  streak: number;   // consecutive active days
}

interface CurrentUser {
  id:      number;
  name:    string;
  state:   string;
  weekly:  { xp: number; streak: number; rank: number };
  monthly: { xp: number; streak: number; rank: number };
}
```

---

## Features

- **Weekly / Monthly tabs** — toggle between periods; ranking order can differ.
- **Top 50** — only the top 50 farmers are displayed per filtered view.
- **State filter** — "All India" shows all farmers; selecting a state filters and re-ranks within that state.
- **Rank badges** — trophy for #1, medal icons for #2–3, teal pill for 4–10, plain number for the rest.
- **Relative XP bar** — each row's progress bar is proportional to rank-1's XP, giving instant visual context.
- **Streak indicator** — flame icon + days count.
- **Current user row** — always pinned below the list (even when outside top 50) with an XP-gap hint ("1.2K more XP to crack Top 50").
- **Accessible** — `role="row"`, `role="progressbar"`, `aria-label`, `aria-selected` on tabs.

---

## File structure

```
Leaderboard/
├── index.js                    Barrel export
├── LeaderboardScreen.jsx       Main screen (pure render)
├── README.md
├── components/
│   ├── Avatar.jsx              Initials circle with deterministic colour
│   ├── CurrentUserBanner.jsx   Pinned current-user section
│   ├── FarmerRow.jsx           Single leaderboard row
│   ├── RankBadge.jsx           Rank position badge
│   └── StateBadge.jsx          2-letter state chip
├── constants/
│   └── states.js               INDIAN_STATES list + STATE_CODES map
├── data/
│   └── mockLeaderboard.js      Seed data for dev / Storybook / tests
├── hooks/
│   └── useLeaderboard.js       All state + derived data logic
└── utils/
    └── formatters.js           formatXP · getInitials · getAvatarColor
```

---

## Swapping in real data

The component accepts data via props — no internal API calls.
Wire it up in your data layer however you prefer:

```jsx
// Example: React Query
import { useQuery } from "@tanstack/react-query";
import LeaderboardScreen from "@/screens/Leaderboard";

export default function LeaderboardPage() {
  const { data: weekly  } = useQuery({ queryKey: ["leaderboard", "weekly"],  queryFn: fetchWeekly  });
  const { data: monthly } = useQuery({ queryKey: ["leaderboard", "monthly"], queryFn: fetchMonthly });
  const { data: me      } = useQuery({ queryKey: ["me"],                     queryFn: fetchCurrentUser });

  if (!weekly || !monthly || !me) return <Spinner />;

  return <LeaderboardScreen weeklyData={weekly} monthlyData={monthly} currentUser={me} />;
}
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `react` ≥ 17 | Component runtime |
| Tabler Icons CSS | Trophy / medal / flame / map-pin icons |

Add Tabler Icons to your HTML entry point or `index.css`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
/>
```

Or install the npm package:

```bash
npm install @tabler/icons-webfont
```

```js
// In your global CSS entry
import "@tabler/icons-webfont/tabler-icons.css";
```

---

## Theming

All colours reference CSS custom properties with sensible fallbacks, so the
component works out-of-the-box in both light and dark themes:

| Variable | Fallback | Used for |
|----------|----------|----------|
| `--color-background-primary` | `#ffffff` | Card background |
| `--color-background-secondary` | `#f4f4f4` | Tab bar, column header |
| `--color-background-tertiary` | `#f0f0f0` | State badge fill |
| `--color-background-info` | `#EFF6FF` | Current user row |
| `--color-text-primary` | `#111111` | Names, XP values |
| `--color-text-secondary` | `#6b7280` | Labels, badges |
| `--color-text-info` | `#1A56DB` | "you" chip |
| `--color-border-tertiary` | `rgba(0,0,0,0.08)` | Row dividers |
| `--color-border-secondary` | `rgba(0,0,0,0.15)` | Divider line |
| `--color-border-info` | `#60A5FA` | Current user left border |
| `--font-sans` | `system-ui` | All text |
| `--border-radius-lg` | `12px` | Outer card |
| `--border-radius-md` | `8px` | Tab bar |
