# Rate App Flow

Smart, non-intrusive app rating flow for KisanSathi (Expo / React Native).

Triggers the native App Store / Play Store rating prompt on the 7th app open,
once per major version, with a 90-day cooldown after dismissal. If the user
declines, shows a custom feedback form. Tracks all events to PostHog.

---

## Install dependencies

```bash
npx expo install expo-store-review expo-constants
npx expo install @react-native-async-storage/async-storage
```

---

## Integration — 4 steps

### 1. Init PostHog analytics (once, at app startup)

```js
// app/_layout.tsx  or  App.js
import { initRateAppAnalytics } from "@/features/RateApp";
import posthog from "@/lib/posthog";

initRateAppAnalytics(posthog);
```

### 2. Wire into your root component

```jsx
// App.js  or  app/_layout.tsx
import { useRateApp, useAppOpenTracker, RateAppPrompt } from "@/features/RateApp";

export default function App() {
  const rateApp = useRateApp();

  // Tracks every app open; triggers maybeShow() when conditions are met
  useAppOpenTracker({ onEligible: rateApp.maybeShow });

  return (
    <NavigationContainer>
      <RootStack />
      <RateAppPrompt controller={rateApp} />   {/* ← add this */}
    </NavigationContainer>
  );
}
```

### 3. (Optional) Add a dev reset in your settings / shake menu

```js
import { __devResetRateAppStorage } from "@/features/RateApp";

// In your dev menu or settings:
<Button title="Reset rate app state" onPress={__devResetRateAppStorage} />
```

### 4. (Optional) Trigger manually after a positive moment

```js
// e.g. after user's first successful sale
const rateApp = useRateApp();
rateApp.maybeShow(openCount); // still respects all conditions
```

---

## Full flow

```
App open #7 (conditions: not already shown for v2.x, cooldown cleared)
    ↓ delay 2.5 s
"Enjoying KisanSathi?" bottom sheet
    │
    ├── "Rate KisanSathi"    →  expo-store-review  →  track 'rated'       →  DONE
    │
    ├── "Give Feedback"      →  FeedbackForm modal  →  submit
    │                                                    ├── track 'feedback_submitted'
    │                                                    └── thank-you → auto-close 2.5 s
    │
    └── "Later" / backdrop   →  track 'dismissed'   →  90-day cooldown
```

---

## State machine

```
HIDDEN
  ↓ maybeShow()
RATE_PROMPT   ── "Rate Now"       ──→ HIDDEN   (rated = true, no more prompts this version)
  │
  ├── "Give Feedback"  ────────────→ FEEDBACK_FORM
  │                                      ├── submit ──→ THANKYOU ──(2.5 s)──→ HIDDEN
  │                                      └── cancel ──→ HIDDEN
  │
  └── "Later" / dismiss ──────────→ HIDDEN   (90-day cooldown)
```

---

## AsyncStorage schema

| Key | Type | Description |
|---|---|---|
| `kisan_rate_open_count` | integer | Total lifetime app opens |
| `kisan_rate_last_shown_at` | ISO string | When prompt was last displayed |
| `kisan_rate_shown_versions` | JSON string[] | Major versions already prompted |
| `kisan_rate_next_eligible_at` | ISO string | Earliest next prompt date |
| `kisan_rate_user_rated` | `"true"` | User tapped "Rate Now" |
| `kisan_rate_feedback_given` | `"true"` | User submitted feedback form |

---

## PostHog events

### `rate_prompt_shown`

| Property | Type | Example |
|---|---|---|
| `app_version` | string | `"2.4.1"` |
| `major_version` | string | `"2"` |
| `open_count` | number | `7` |
| `platform` | string | `"ios"` |
| `trigger` | string | `"app_open_count"` |

### `rate_prompt_responded`

| Property | Type | Values |
|---|---|---|
| `action` | string | `"rated"` · `"declined_feedback"` · `"declined_dismissed"` |
| + all base props | | |

### `rate_feedback_submitted`

| Property | Type | Notes |
|---|---|---|
| `star_rating` | 1–5 | |
| `categories` | string[] | e.g. `["ux", "prices"]` |
| `has_message` | boolean | `true` if user typed text — text NOT sent to PostHog (PII) |
| + all base props | | |

---

## Configuration

All thresholds live in `constants/rateAppConfig.js`:

```js
export const RATE_APP_CONFIG = {
  OPENS_REQUIRED:         7,     // show after N app opens
  COOLDOWN_DAYS:          90,    // days before re-prompting
  SHOW_DELAY_MS:          2500,  // delay after app open before showing
  ONCE_PER_MAJOR_VERSION: true,  // show once per X.y.z → X
};
```

---

## File structure

```
src/features/RateApp/
├── index.js                         ← barrel export
├── README.md
├── constants/
│   └── rateAppConfig.js             ← thresholds, keys, PostHog event names
├── utils/
│   ├── rateAppStorage.js            ← AsyncStorage helpers + eligibility check
│   └── rateAppAnalytics.js          ← PostHog event senders
├── hooks/
│   ├── useAppOpenTracker.js         ← AppState listener + open counter
│   └── useRateApp.js                ← state machine + all handlers
└── components/
    ├── RateAppPrompt.jsx            ← bottom sheet orchestrator
    └── FeedbackForm.jsx             ← star rating + chips + text input
```

---

## Sending feedback to your backend

In `useRateApp.js`, find the comment:

```js
// TODO: send feedback.message to your support API here
// await submitFeedbackToBackend({ ...feedback, appVersion, platform: Platform.OS });
```

Replace with your API call. The message text is intentionally **not** sent
to PostHog (it may contain PII). Send it only to a backend you control.

---

## Testing the flow in development

```js
// 1. Reset all state
await __devResetRateAppStorage();

// 2. Fast-forward open count to 7
for (let i = 0; i < 7; i++) await incrementOpenCount();

// 3. Trigger manually
rateApp.maybeShow(7);
```

Or add a button to your dev settings screen:

```jsx
<Button
  title="Test rate prompt"
  onPress={async () => {
    await __devResetRateAppStorage();
    rateApp.maybeShow(7);
  }}
/>
```

---

## Supported platforms

| Platform | Native store review | Fallback |
|---|---|---|
| iOS | `StoreReview.requestReview()` | `openStoreFrontAsync()` |
| Android | In-app review API | `openStoreFrontAsync()` |
| Expo Go / Simulator | Not available | `openStoreFrontAsync()` |

`expo-store-review` handles the platform differences transparently via `isAvailableAsync()`.
