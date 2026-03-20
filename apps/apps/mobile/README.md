# 📱 KrishiSahayak — Mobile App

> React Native + Expo SDK 54 · iOS & Android · TypeScript strict

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router v6 (file-based) |
| Language | TypeScript 5.x strict |
| Styling | NativeWind v4 |
| State | Zustand + TanStack Query v5 |
| Backend | Supabase (Postgres + Realtime + Auth + Storage) |
| Auth | Supabase Auth + Twilio Verify (Phone OTP) |
| Analytics | PostHog (`src/analytics`) |
| Errors | Sentry |
| Animations | Reanimated 4 + Lottie |
| Offline | WatermelonDB + MMKV |

---

## Folder Structure

```
apps/apps/mobile/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx         # Root layout — PostHog + ThemeProvider
│   ├── (tabs)/             # Bottom tab navigator
│   └── modal.tsx           # Modal screen
├── src/
│   ├── analytics/          # PostHog events + track() helper
│   │   ├── events.ts       # 15 typed core events
│   │   ├── analytics.ts    # track(), identifyUser(), resetUser()
│   │   ├── PostHogProvider.tsx
│   │   └── index.ts
│   ├── components/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Supabase client, API helpers
│   ├── stores/             # Zustand stores
│   └── types/              # Global TypeScript types
├── assets/                 # Fonts, images, icons
├── constants/              # Theme colours, spacing, config
├── .env.example            # Required environment variables
├── app.json                # Expo config
└── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 20 LTS
- pnpm (`npm install -g pnpm`)
- Expo Go app on your phone **or** Android Emulator / iOS Simulator

### 1. Install dependencies
```bash
# From repo root
pnpm install

# Or from this directory
cd apps/apps/mobile && npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_posthog_key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com

EXPO_PUBLIC_SENTRY_DSN=https://your_sentry_dsn
```

### 3. Start the dev server
```bash
npx expo start
```

Then press:
- `i` — open iOS Simulator
- `a` — open Android Emulator
- `w` — open in browser
- Scan QR code with Expo Go on your phone

---

## Analytics

All events are tracked via PostHog. See [`src/analytics/events.ts`](src/analytics/events.ts) for the full list of 15 core events.

**Usage:**
```ts
import { track, ANALYTICS_EVENTS } from '@/src/analytics';

track(ANALYTICS_EVENTS.WEATHER_VIEWED, {
  location_name: 'Pune',
  source: 'gps',
});
```

Full guide: [`docs/analytics-setup.md`](../../../docs/analytics-setup.md)

---

## Useful Commands

```bash
# Start dev server
npx expo start

# Run on Android emulator
npx expo start --android

# Run on iOS simulator
npx expo start --ios

# Type-check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Clear Metro cache
npx expo start --clear
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | ✅ | PostHog project API key |
| `EXPO_PUBLIC_POSTHOG_HOST` | ✅ | PostHog host URL |
| `EXPO_PUBLIC_SENTRY_DSN` | ⚠️ | Sentry DSN (optional in dev) |

> All variables must be prefixed with `EXPO_PUBLIC_` to be accessible client-side.

---

*KrishiSahayak MVP · Hura Group · Mobile App*
