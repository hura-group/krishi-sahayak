# 🌐 KrishiSahayak — Web App

> Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.x strict |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | TanStack Query v5 |
| Backend | Supabase (same project as mobile) |
| Auth | Supabase Auth |
| Analytics | PostHog |
| Errors | Sentry |
| Deploy | Vercel (auto-deploy on push to `main`) |

---

## Folder Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── (dashboard)/        # Authenticated routes
├── components/             # Shared UI components
├── lib/                    # Supabase client, utils
├── public/                 # Static assets
├── .env.example            # Required environment variables
├── next.config.ts          # Next.js config
└── package.json
```

---

## Local Setup

### Prerequisites
- Node.js 20 LTS
- pnpm (`npm install -g pnpm`)

### 1. Install dependencies
```bash
# From repo root
pnpm install

# Or from this directory
cd apps/web && npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn
```

### 3. Start the dev server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Useful Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Type-check
npx tsc --noEmit
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `NEXT_PUBLIC_POSTHOG_KEY` | ✅ | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | ✅ | PostHog host URL |
| `NEXT_PUBLIC_SENTRY_DSN` | ⚠️ | Sentry DSN (optional in dev) |

---

## Deployment

This app auto-deploys to Vercel on every push to `main`.

- **Production:** [krishisahayak.com](https://krishisahayak.com)
- **Vercel Dashboard:** [vercel.com/hura-group/krishisahayak-web](https://vercel.com)

---

*KrishiSahayak MVP · Hura Group · Web App*
