# 🚀 KrishiSahayak — CI/CD Pipeline Guide

**Owner: Umang (B)** · Read-access for all team members · Last updated: Week 1

---

## Overview

```
Developer machine          GitHub                      EAS (Expo)         Vercel
─────────────────          ──────────────────────      ──────────────      ──────────
git commit                 
  ↓                        
Husky pre-commit           
  → lint-staged            
  → commit-msg check       
  ↓                        
git push → branch          
  ↓                        
Open Pull Request ──────→  CI Workflow runs:           
                           1. ESLint                   
                           2. TypeScript check         
                           3. Jest tests               
                           4. Security audit           
                             ↓                         
                           All green + 1 approval      
                             ↓                         
                           Merge to main ───────────→  Preview APK build  Web deploy
                             ↓                         (auto, ~30 min)    (auto, ~3 min)
                           Release tag ─────────────→  Prod AAB + IPA     
                                                       (with approval)
```

---

## Workflows

### 1. `ci.yml` — Runs on every PR and push to main

| Job | What it checks | Fails on |
|---|---|---|
| `lint` | ESLint rules — zero warnings allowed | Any ESLint error or warning |
| `typecheck` | TypeScript strict mode — zero errors | Any `tsc` error |
| `test` | Jest unit tests | Failing tests or coverage < 70% |
| `security` | npm audit for HIGH/CRITICAL vulns | HIGH or CRITICAL CVE in dependencies |
| `ci-success` | Aggregates all 4 above | If ANY of the above fail |

Branch protection only checks `ci-success`. If all 4 jobs pass, `ci-success` passes and the PR can be merged.

---

### 2. `build.yml` — Runs on merge to main and on Release

| Trigger | What builds | Time |
|---|---|---|
| Push to `main` | Android Preview APK (internal testing) | ~30 min |
| GitHub Release | Android Production AAB + iOS IPA | ~45-60 min |
| Manual dispatch | Any platform + profile you choose | ~30-60 min |

**Important:** EAS builds are queued on Expo's servers. The workflow triggers the build and exits — it does NOT wait for the build to finish. Check build progress at: https://expo.dev/accounts/hura-group/projects/krishisahayak/builds

---

### 3. `pr-checks.yml` — Advisory checks on every PR

| Check | What it does |
|---|---|
| PR title format | Validates title follows `type(scope): description` |
| Changed files | Posts a comment listing all changed files |
| Linked issue | Warns if no `Closes #123` in PR description |

These are **advisory only** — they don't block merging, just inform the reviewer.

---

### 4. `scheduled.yml` — Runs every Monday 9 AM IST

| Job | What it does |
|---|---|
| `dependency-check` | Scans for outdated packages, creates a GitHub issue if found |
| `stale` | Labels issues/PRs inactive for 14+ days, closes after 7 more |

---

## How to Trigger a Manual Build

1. Go to GitHub → **Actions** tab
2. Click **EAS Build — Preview & Production** in the left sidebar
3. Click **Run workflow** (top right)
4. Select:
   - **Platform:** android / ios / all
   - **Profile:** preview / production
   - **Reason:** write why you're triggering manually
5. Click **Run workflow**

---

## Reading CI Results

### On a Pull Request

After pushing to a branch and opening a PR, scroll down to the **Checks** section:

```
✅ CI — Lint · TypeCheck · Test · Security   Details →
✅ PR Quality Checks                          Details →
```

Click **Details** to see the full log of any job.

---

### If CI fails

**ESLint fails:**
```bash
# Run locally to see the same errors
pnpm lint

# Auto-fix what can be fixed
pnpm lint:fix
```

**TypeScript fails:**
```bash
# Run locally
pnpm typecheck
# Fix each error shown — usually missing types or `any` usage
```

**Tests fail:**
```bash
# Run locally
pnpm test

# Run in watch mode to fix interactively
pnpm test --watch
```

**Security audit fails:**
```bash
# See what's vulnerable
pnpm audit

# Update the specific package
pnpm update <package-name>

# If it's a false positive or no fix available, document it
```

---

## GitHub Secrets Setup

Set these ONCE in GitHub → Settings → Secrets → Actions:

```
EXPO_TOKEN          expo.dev → Account Settings → Access Tokens
SUPABASE_URL        Supabase dashboard → Settings → API → Project URL
SUPABASE_ANON_KEY   Supabase dashboard → Settings → API → anon key
GOOGLE_MAPS_KEY     Google Cloud Console → APIs → Credentials
SENTRY_DSN          sentry.io → Project → Settings → Client Keys (DSN)
POSTHOG_KEY         posthog.com → Project → Settings → Project API Key
SLACK_WEBHOOK_URL   Optional — Slack Apps → Incoming Webhooks
```

**After adding secrets:**
- Trigger a manual build to verify the secrets work
- Check the build log — secrets are masked (shown as `***`) in logs

---

## Branch Protection Rules Summary

Configured in GitHub → Settings → Branches → `main`:

| Rule | Setting |
|---|---|
| Require PR before merging | ✅ Enabled |
| Required approvals | 1 |
| Dismiss stale approvals | ✅ On new commits |
| Require status checks | `ci-success` |
| Require up-to-date branch | ✅ Enabled |
| Block force pushes | ✅ Enabled |
| Restrict deletions | ✅ Enabled |

---

## EAS Build Profiles

Defined in `eas.json`:

| Profile | Distribution | Android | iOS | When to use |
|---|---|---|---|---|
| `development` | Internal | Debug APK | Simulator | Local development |
| `preview` | Internal | APK | Device | Team testing, UAT |
| `production` | Store | AAB | IPA | Play Store + App Store |

---

## Troubleshooting

**"EXPO_TOKEN secret not found" in build logs**
→ Add the secret in GitHub → Settings → Secrets → Actions

**"frozen-lockfile" install fails**
→ Someone committed code without running `pnpm install` first.
Fix: run `pnpm install` locally, commit the updated `pnpm-lock.yaml`

**Build queues but never starts on EAS**
→ EAS free tier has build queue limits.
Check: https://expo.dev/accounts/hura-group/projects/krishisahayak/builds

**PR has green CI but merge button is grey**
→ Branch protection requires at least 1 approval.
Request review from Kartik or Harsh.

**CI runs on draft PRs**
→ The `no-draft` job in `pr-checks.yml` will fail if your PR is a draft.
Click "Ready for review" on your PR to proceed.
