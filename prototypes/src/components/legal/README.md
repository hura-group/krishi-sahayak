# Privacy Policy + Terms of Service

Complete legal pages, GDPR cookie consent, and in-app legal links for KisanSathi.

---

## File structure

```
src/
├── content/legal/
│   ├── privacyPolicy.js          ← ~1,550 words (DPDP + GDPR)
│   └── termsOfService.js         ← ~2,050 words (platform + marketplace)
│
├── components/legal/
│   ├── LegalPageLayout.jsx       ← shared page shell (TOC, scroll-spy, print styles)
│   └── CookieConsent.jsx         ← GDPR banner + preferences panel
│
├── hooks/
│   └── useCookieConsent.js       ← consent state, localStorage, 12-month TTL
│
└── features/
    └── Settings/components/
        └── LegalLinks.jsx        ← also exports LegalConsent (onboarding)

app/
├── privacy/page.jsx              ← /privacy route (Next.js App Router)
├── terms/page.jsx                ← /terms route
└── layout.example.jsx            ← shows where to mount <CookieConsent />
```

---

## Setup — 3 steps

### 1. Add to root layout

```jsx
// app/layout.jsx
import CookieConsent from "@/components/legal/CookieConsent";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
```

### 2. Add to Settings screen

```jsx
import { LegalLinks } from "@/features/Settings/components/LegalLinks";

// Inside your SettingsScreen component:
<LegalLinks />
```

### 3. Add to Onboarding flow

```jsx
import { LegalConsent } from "@/features/Settings/components/LegalLinks";

const [legalAccepted,  setLegalAccepted]  = useState(false);
const [marketingOptIn, setMarketingOptIn] = useState(false);

<LegalConsent
  legalAccepted={legalAccepted}
  onLegalChange={setLegalAccepted}
  marketingOptIn={marketingOptIn}
  onMarketingChange={setMarketingOptIn}
/>
<button disabled={!legalAccepted} onClick={handleCreateAccount}>
  Create Account
</button>
```

---

## Cookie consent categories

| Category | Default | Purpose |
|---|---|---|
| Strictly Necessary | Always on | Auth sessions, CSRF, core functionality |
| Analytics | Off | Usage tracking (Posthog), error logging |
| Personalisation | Off | Language, notification prefs, crop history |
| Marketing | Off | Third-party ad pixels |

Consent is stored in `localStorage` (key: `kisan_cookie_consent`) and a
server-readable cookie (`kisan_consent`) for 12 months, then re-requested.

---

## Reading consent in your analytics/tracking code

```js
import { useCookieConsent } from "@/hooks/useCookieConsent";

function AnalyticsProvider({ children }) {
  const { hasConsent } = useCookieConsent();

  useEffect(() => {
    if (hasConsent("analytics")) {
      posthog.init("your-key", { loaded: (ph) => ph.opt_in_capturing() });
    }
  }, [hasConsent]);

  return children;
}
```

---

## Updating the policy text

All policy text lives as structured JS objects in `src/content/legal/`.
- Update the section `.body` strings
- Bump `lastUpdated`, `effectiveDate`, and `version`
- The pages re-render automatically on next build

No CMS required — the content is version-controlled alongside the code.

---

## Legal compliance checklist

| Requirement | Covered |
|---|---|
| India DPDP Act 2023 — consent at registration | ✅ `LegalConsent` onboarding component |
| India DPDP Act 2023 — user rights (access/delete) | ✅ Privacy § 6, Settings → Data & Privacy |
| India DPDP Act 2023 — Grievance Officer details | ✅ Privacy § 13, Settings LegalLinks |
| GDPR — legal basis for processing | ✅ Privacy § 4 |
| GDPR — cookie consent before non-essential tracking | ✅ `CookieConsent` banner (opt-in model) |
| GDPR — right to withdraw consent | ✅ `useCookieConsent` + cookie settings button |
| GDPR — data portability + erasure | ✅ Privacy § 6 |
| Consumer Protection Act 2019 | ✅ ToS § 6.4 |
| Arbitration clause (India) | ✅ ToS § 9.2 |
| Marketplace rules (prohibited listings) | ✅ ToS § 3.6 |
| Children's privacy (18+) | ✅ Privacy § 10, ToS § 1.1 |

> **Important:** This implementation provides a technically correct framework but
> does not constitute legal advice. Have your final policy text reviewed by a
> qualified lawyer before going live, especially for the marketplace and data
> processing sections.

---

## Customising for your brand

Search and replace these placeholders in the content files:

| Placeholder | Replace with |
|---|---|
| `KisanSathi` | Your app name |
| `KisanSathi Technologies Pvt. Ltd.` | Your legal entity name |
| `kisansathi.in` | Your domain |
| `GIFT City, Gandhinagar, Gujarat` | Your registered address |
| `dpo@kisansathi.in` | Your DPO email |
| `19 May 2026` | Today's date |
