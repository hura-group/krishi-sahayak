# PostHog Analytics Setup — Krishi Sahayak

## 1. Install the SDK

```bash
cd apps/apps/mobile
npx expo install posthog-react-native
```

> For bare workflow also run: `npx pod-install`

---

## 2. Set your API key

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your PostHog project API key:

```env
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_real_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

Get your key from: **PostHog → Project → Settings → Project API Key**

---

## 3. Provider is already wired

`app/_layout.tsx` already wraps the app with `<PostHogProvider>`. No extra setup needed.

---

## 4. Firing events

```ts
import { track, ANALYTICS_EVENTS } from '@/src/analytics';

// Simple
track(ANALYTICS_EVENTS.APP_OPEN, { source: 'cold_start' });

// With full type safety
track(ANALYTICS_EVENTS.WEATHER_VIEWED, {
  location_name: 'Pune',
  source: 'gps',
});
```

---

## 5. The 15 core events

| Event | When to fire |
|---|---|
| `app_open` | App launched / foregrounded |
| `app_background` | App sent to background |
| `otp_sent` | OTP requested |
| `otp_verified` | OTP verified successfully |
| `otp_failed` | OTP verification failed |
| `logout` | User logged out |
| `onboarding_started` | First-time user starts onboarding |
| `onboarding_completed` | User completes onboarding |
| `weather_viewed` | Weather screen opened |
| `weather_location_changed` | User changes location |
| `crop_selected` | User picks a crop |
| `advisory_viewed` | Advisory detail opened |
| `market_price_viewed` | Mandi price screen opened |
| `tab_switched` | Bottom tab changed |
| `api_error` | Any API call failure |

---

## 6. Confirm events in PostHog dashboard

1. Run the app in the emulator: `npx expo start`
2. Trigger an event (e.g. open the app → `app_open` fires)
3. Go to **PostHog → Activity → Live Events**
4. You should see the event appear within seconds ✅

---

## 7. Identifying users

```ts
import { identifyUser, resetUser } from '@/src/analytics';

// After login
identifyUser(user.id, { name: user.name, phone_masked: '+91 ****1234' });

// On logout
resetUser();
```
