---
title: "[P1] No i18n infrastructure exists in either app — blocks every Hindi/Gujarati matrix cell"
labels: P1,infra-blocker,lang:hi,lang:gu,qa-sweep
---

## Severity
**P1 — must fix before launch.** Blocks every Hindi/Gujarati row across both `apps/mobile` and `apps/web` — 40 of 60 matrix cells (67%).

## Finding

Verified directly against the real repo:

```
$ grep -rl "useTranslation\|i18next" apps/mobile apps/web --include="*.tsx" --include="*.ts" | grep -v node_modules
(0 results)

$ find apps/mobile apps/web -iname "*locales*" -o -iname "*hi.json*" -o -iname "*gu.json*"
(0 results)
```

No translation library, no locale files, in either app. Every user-facing string in `MarketFilter`, `PriceAlerts`, `MandiLocator`, the tab screens, and the web `market`/`news`/`schemes` pages is a literal hardcoded English string in JSX/TSX.

## Why this is P1, not P2

KrishiSahayak's target users are Indian farmers — Hindi and Gujarati are very plausibly the primary languages for a meaningful share of that audience, not English. This single fix unblocks more test-matrix cells than anything else on the board.

## Recommended fix
1. Pick an i18n library — `react-i18next` + `expo-localization` is the standard pairing for Expo/React Native; `next-intl` or `next-i18next` for the Next.js web app.
2. Extract hardcoded strings from `MarketFilter`, `PriceAlerts`, `MandiLocator`, the tab screens, and the web app into `locales/en.json`.
3. Produce `hi.json` and `gu.json` via a native-speaker translation pass — agricultural terminology (mandi, MSP, quintal, APMC) needs domain-accurate translation, not machine translation, for a farmer-facing production app.
4. Re-run the 40 blocked matrix rows once this lands.

## Acceptance criteria
- [ ] i18n wired in both apps with device-language auto-detection + manual override
- [ ] `locales/en.json`, `hi.json`, `gu.json` exist with 100% key parity
- [ ] Zero hardcoded user-facing strings remain in the three feature areas + web pages
- [ ] Hindi/Gujarati matrix rows unblocked and re-run

## References
- Test matrix: `qa-sweep/test-matrix/test-matrix.csv`
- Audit evidence: `qa-sweep/audit-log.md`
- Related: P1-003 (Indic font rendering, depends on this landing first)
