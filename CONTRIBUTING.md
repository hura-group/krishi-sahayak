# 🌾 Contributing to KrishiSahayak

> Internal guide for Kartik (A), Umang (B), and Harsh (C) — Hura Group.
> Every rule here exists to protect sprint velocity and prevent broken builds.

---

## 🌿 Branch Naming

Always branch off `main`. **Never commit directly to `main`.**

| Type | Pattern | Example |
|---|---|---|
| New feature | `feat/short-description` | `feat/weather-screen` |
| Bug fix | `fix/what-you-fixed` | `fix/otp-shake-animation` |
| Config / tooling | `chore/what-you-did` | `chore/eslint-setup` |
| Hotfix (urgent) | `hotfix/description` | `hotfix/market-price-crash` |
| Testing | `test/what-you-tested` | `test/price-trend-calculation` |
| Documentation | `docs/what-you-wrote` | `docs/weather-api-notes` |

**Rules:**
- Lowercase only — hyphens, not underscores
- Max 4 words after the prefix
- One feature or fix per branch — never bundle unrelated changes

---

## 📝 Commit Message Format

We use **Conventional Commits**. Every commit must follow:

```
type(scope): short description in present tense
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or screen |
| `fix` | Bug fix |
| `chore` | Config, tooling, no logic change |
| `style` | Formatting only, zero logic change |
| `refactor` | Code restructure, same behaviour |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `perf` | Performance improvement |

### Scopes — use the module name

`auth` `weather` `market` `pest` `marketplace` `community` `chat`
`gamification` `expense` `notifications` `settings` `offline` `i18n` `ui`

### Good examples ✅

```
feat(weather): add 7-day forecast screen with rain probability ring
fix(otp): correct shake animation trigger on wrong verification code
chore(eslint): add expo config and prettier integration
test(market): add unit tests for price trend percentage calculation
perf(community): memoize post card to prevent unnecessary re-renders
docs(readme): add local setup steps for Android emulator
```

### Never do these ❌

```
fix
wip
changes
Merged branch feat/weather
```

**Rules:**
- Max 72 characters on the first line
- Present tense: "add feature" not "added feature"
- Husky will block commits that fail ESLint — fix before committing

---

## 🔀 Pull Request Process

1. **Open PR against `main`** — never merge without a PR
2. **Fill the PR template completely** — every section, no blanks
3. **One review required** — any other team member
4. **CI must be green** — ESLint + TypeScript + Jest all passing
5. **No self-merges** — you cannot approve your own PR
6. **Keep PRs small** — one feature or one fix per PR

### Saturday sync rule

Every Saturday, all open PRs are reviewed, merged, and `main` is deployed.
If your PR is not ready by Saturday standup, it moves to the catch-up list.

---

## ✅ Code Quality Standards

### TypeScript
- `strict: true` — zero `any` types in production code
- All props and function parameters must have explicit types

### React Native / React
- All API calls wrapped in `try/catch` with user-visible error states
- Functional components only — no class components
- All functions under 40 lines — single responsibility principle

### Security
- Zero API keys in client-side code — all via environment variables
- JWT tokens in `expo-secure-store`, never `AsyncStorage`
- Never commit `.env` files

---

## 📋 Daily Workflow

```bash
# Start of day
git checkout main && git pull origin main

# Create branch
git checkout -b feat/your-feature-name

# Work, commit
git add .
git commit -m "feat(scope): what you did"

# Push and open PR on GitHub
git push origin feat/your-feature-name
```

---

*KrishiSahayak MVP · Hura Group · Week 1 Day 1*
