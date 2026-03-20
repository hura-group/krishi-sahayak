# 🔒 Branch Protection Setup Guide
## Main Branch — KrishiSahayak

**Do this ONCE after pushing the first commit to GitHub.**
**Owner: Umang (B) — only a repo admin can do this.**

---

## Step-by-Step Instructions

### 1. Open Branch Protection Settings

Go to your GitHub repository → **Settings** → **Branches** → **Add branch ruleset**

Or go directly:
```
https://github.com/YOUR_USERNAME/krishisahayak/settings/branches
```

---

### 2. Create a Ruleset for `main`

Click **Add ruleset** → **New branch ruleset**

Fill in the form exactly like this:

| Setting | Value |
|---|---|
| **Ruleset Name** | `Protect main` |
| **Enforcement status** | Active |
| **Target branches** | `main` |

---

### 3. Configure Rules

Enable each of these checkboxes:

#### Restrict deletions
- ✅ **Checked** — nobody can delete the main branch

#### Require linear history
- ✅ **Checked** — enforces rebase/squash merges (no messy merge commits)

#### Require a pull request before merging
- ✅ **Checked**
  - Required approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (optional — leave unchecked for now)
  - ❌ Do NOT check "Allow specified actors to bypass required pull requests"

#### Require status checks to pass
- ✅ **Checked**
  - ✅ Require branches to be up to date before merging
  - Click **+ Add checks** and add these EXACT check names:
    ```
    ✅ CI Passed
    ```
  > This corresponds to the `ci-success` job in `ci.yml`.
  > It only passes when ALL of lint, typecheck, test, and security pass.

#### Block force pushes
- ✅ **Checked** — nobody can force push to main

---

### 4. Save

Click **Create** at the bottom.

---

## What This Enforces Automatically

After setup, GitHub will enforce:

```
1. You CANNOT push directly to main
   → You must open a PR

2. Your PR CANNOT be merged unless:
   → CI pipeline passes (lint + typecheck + test + security)
   → At least 1 other team member has approved the PR

3. Nobody can delete or force-push to main
   → Protects production history permanently
```

---

## Testing It Works

### Test 1 — Verify direct push is blocked

```bash
git checkout main
echo "test" >> README.md
git add .
git commit -m "test: direct push to main"
git push origin main
# Expected: ERROR — push declined due to repository rule violations
```

### Test 2 — Verify CI gate works

```bash
# Create a branch with a lint error
git checkout -b test/ci-gate-test
echo "const x: any = 'bad code'" >> apps/mobile/src/utils/test-file.ts
git add .
git commit -m "test(ci): verify ci blocks bad code"
git push origin test/ci-gate-test
# Open a PR on GitHub
# Expected: CI runs → ESLint fails → PR shows red ✗ → Cannot be merged
```

### Test 3 — Verify clean PR passes

```bash
git checkout -b feat/test-clean-pr
echo "" >> README.md
git add .
git commit -m "docs(readme): add blank line for ci test"
git push origin feat/test-clean-pr
# Open a PR on GitHub → request review from a teammate
# Expected: CI runs → all green ✓ → teammate approves → merge button turns green
```

---

## Team Responsibilities

| Role | Responsibility |
|---|---|
| **Kartik (A)** | Reviews and approves PRs from Umang and Harsh |
| **Umang (B)** | Reviews and approves PRs from Kartik and Harsh · Maintains CI/CD |
| **Harsh (C)** | Reviews and approves PRs from Kartik and Umang |

**Saturday rule:** All open PRs must be reviewed and merged by end of Saturday sync.
If a PR has been open more than 48 hours with no review, ping in WhatsApp group.

---

## Required GitHub Secrets

Set these in: **GitHub → Settings → Secrets → Actions → New repository secret**

| Secret Name | Where to get it | Used by |
|---|---|---|
| `EXPO_TOKEN` | expo.dev → Account Settings → Access Tokens → Create | build.yml |
| `SUPABASE_URL` | Supabase dashboard → Settings → API | build.yml |
| `SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API | build.yml |
| `GOOGLE_MAPS_KEY` | Google Cloud Console → APIs → Credentials | build.yml |
| `SENTRY_DSN` | sentry.io → Project → Settings → Client Keys | build.yml |
| `POSTHOG_KEY` | posthog.com → Project → Settings → API Key | build.yml |
| `SLACK_WEBHOOK_URL` | Slack → Apps → Incoming Webhooks (optional) | build.yml |

> **Important:** These secrets are encrypted at rest in GitHub.
> They are injected as environment variables during the build — never printed in logs.
> Never put real values in any file committed to the repo.
