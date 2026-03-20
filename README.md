# 🌾 KrishiSahayak

> Empowering 140 million Indian farmers with a global-quality super-app.

Built by **Kartik · Umang · Harsh** — Hura Group · 16-Week MVP Sprint

---

## What Is KrishiSahayak?

KrishiSahayak is a real-time farmer super-app for iOS, Android, and web.
It is not a student project. It is a product built to compete with funded startups
and distributed on public app stores from Day 1.

**Core features:** Live mandi prices · AI pest detection · Real-time weather + crop tips ·
Govt scheme eligibility engine · P2P marketplace + equipment rental · Farmer community + chat ·
Expense tracker · Gamification + leaderboard · Offline-first architecture · 4 languages

---

## Monorepo Structure

```
krishisahayak/
├── apps/
│   ├── mobile/          # React Native (Expo SDK 51) — iOS + Android
│   └── web/             # Next.js 14 (App Router) — krishisahayak.com
├── packages/
│   └── ui/              # Shared components (Button, Card, etc.)
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ci.yml           # GitHub Actions — lint → typecheck → test
├── .husky/              # Pre-commit + commit-msg hooks
├── CONTRIBUTING.md      # Branch naming, commit format, PR rules
├── .eslintrc.js         # ESLint config (eslint-config-expo + prettier)
├── .prettierrc          # Prettier config
├── tsconfig.json        # TypeScript config (strict: true)
└── package.json         # Root scripts + lint-staged config
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/hura-group/krishisahayak.git
cd krishisahayak

# 2. Install everything
pnpm install

# 3. Set up environment variables
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env.local
# Fill in both files — see each app's README.md for details

# 4. Start mobile
cd apps/mobile && pnpm start

# 5. Start web (separate terminal)
cd apps/web && pnpm dev
```

Full setup guide: [`apps/mobile/README.md`](apps/mobile/README.md) · [`apps/web/README.md`](apps/web/README.md)

---

## Tech Stack

| Layer | Mobile | Web |
|---|---|---|
| Language | TypeScript 5.x strict | TypeScript 5.x strict |
| Framework | React Native 0.74 + Expo SDK 51 | Next.js 14 App Router |
| Styling | NativeWind v4 | Tailwind CSS 3.x + shadcn/ui |
| State | Zustand + TanStack Query v5 | TanStack Query v5 |
| Backend | Supabase (Postgres 15 + Realtime + Auth + Storage) | Supabase (same project) |
| Auth | Supabase Auth + Twilio Verify (Phone OTP) | Supabase Auth |
| AI | Plant.id (pest detection) | — |
| Offline | WatermelonDB + MMKV | — |
| Animations | Reanimated 3 + Lottie | CSS animations |
| Analytics | PostHog | PostHog |
| Errors | Sentry | Sentry |
| CI/CD | GitHub Actions + EAS Build | Vercel auto-deploy |

---

## Team & Roles

| Member | Role | Primary Ownership |
|---|---|---|
| **Kartik (A)** | Product · UI/UX · Frontend | All screens · Component library · Animations · i18n · Next.js web |
| **Umang (B)** | Backend · DevOps · APIs | Supabase schema · Edge Functions · 3rd-party APIs · CI/CD · Security |
| **Harsh (C)** | QA · Research · Support | Testing · User research · Documentation · Investor deck · Analytics |

---

## Development Rules

- **No direct pushes to `main`** — always open a PR
- **PR requires 1 review** + green CI before merge
- **Commit format:** `feat(weather): add 7-day forecast screen` — see [CONTRIBUTING.md](CONTRIBUTING.md)
- **Husky enforces ESLint + commit format** on every commit automatically
- **Saturday = sync day** — all PRs merged, blockers resolved, next week planned

---

## Sprint Timeline

| Phase | Weeks | Focus |
|---|---|---|
| Foundation | 1–2 | Environment setup · Auth · Onboarding |
| Core modules | 3–8 | Dashboard · Weather · Market · AI · Marketplace |
| Social + Finance | 9–10 | Community · Chat · Expense · Gamification |
| Polish + Launch | 11–16 | Notifications · Offline · Testing · Store submission |

---

## Links

- Figma Design System: [figma.com/...](https://figma.com)
- Notion Sprint Board: [notion.so/...](https://notion.so)
- Supabase Project: [supabase.com/dashboard/...](https://supabase.com)
- Vercel Dashboard: [vercel.com/hura-group/...](https://vercel.com)
- Sentry: [sentry.io/hura-group/...](https://sentry.io)
- PostHog: [app.posthog.com/...](https://app.posthog.com)
