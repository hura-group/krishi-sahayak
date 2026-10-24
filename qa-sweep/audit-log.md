# Audit Log — Polish QA Sweep, Phase 0 (Pre-flight Code Audit)

Run directly against `hura-group/krishi-sahayak` on 2026-06-28. An earlier
draft of this sweep was built against a different exploratory codebase
before this repo was inspected directly — that draft has been discarded.
Everything below was verified against the actual `apps/mobile` and
`apps/web` source.

**What this is NOT:** a device-based visual test. This is read-the-code,
not look-at-the-screen — it catches structural/architectural gaps
reliably; it cannot catch actual rendering bugs. That's Phase 1 (the real
device sweep), once these blockers clear.

---

## Commands run and raw results

### 1. Dark mode — does a theme scaffold exist?
```
$ cat apps/mobile/hooks/use-color-scheme.ts
export { useColorScheme } from 'react-native';

$ cat apps/mobile/constants/theme.ts
const tintColorLight = '#0a7ea4';   // Expo starter default, not brand
const tintColorDark = '#fff';
```
→ Scaffold exists, but is the unmodified Expo starter template.

### 2. Dark mode — do the real feature areas use it?
```
$ grep -l "useThemeColor\|ThemedView\|ThemedText" components/MarketFilter components/PriceAlerts components/MandiLocator -r
(0 results)

$ grep -rc "#[0-9A-Fa-f]\{6\}" components/MarketFilter components/PriceAlerts components/MandiLocator
MarketFilter/FilterPanel.tsx:13   MarketFilter/FilterChips.tsx:5
MarketFilter/MarketPriceList.tsx:3  MarketFilter/MarketPriceCard.tsx:5
PriceAlerts/PriceAlertCard.tsx:8   PriceAlerts/CreateAlertSheet.tsx:23
PriceAlerts/AlertHistoryItem.tsx:6  PriceAlerts/EmptyAlerts.tsx:2
MandiLocator/MandiMarker.tsx:3     MandiLocator/MandiBottomSheet.tsx:17
MandiLocator/MandiListItem.tsx:7   MandiLocator/RadiusSelector.tsx:5
```
97 hardcoded hex instances across the 3 real feature areas, 0 using the
theme system. → Filed as **P1-001**

### 3. i18n hooks
```
$ grep -rl "useTranslation\|i18next" apps/mobile apps/web --include="*.tsx" --include="*.ts" | grep -v node_modules
(0 results)
```

### 4. Locale files
```
$ find apps/mobile apps/web -iname "*locales*" -o -iname "*hi.json*" -o -iname "*gu.json*"
(0 results)
```
→ 3 and 4 together filed as **P1-002**

### 5. Indic font bundling
```
$ find apps/mobile/assets -iname "*noto*" -o -iname "*devanagari*" -o -iname "*gujarati*"
(0 results)

$ cat apps/mobile/app.json | grep -i font
(no custom fonts registered)
```
→ Filed as **P1-003**

### 6. Web — does apps/web have its own theme/i18n?
```
$ grep -rl "darkMode\|dark:" apps/web/app --include="*.tsx"
(0 results)
$ grep -rl "useTranslation\|i18next" apps/web/app --include="*.tsx"
(0 results)
```
→ Same gaps apply to web; covered under P1-001/P1-002 scope.

---

## Summary

| Check | Result | Issue filed |
|---|---|---|
| Dark mode actually used by real screens | 0 of 12 files | P1-001 |
| i18n hooks (either app) | 0 files | P1-002 |
| Locale files (either app) | 0 files | P1-002 |
| Indic font bundling | 0 files | P1-003 |

**Net effect on the test matrix:** 50 of 60 cells (83%) are blocked by
P1-001 + P1-002. Only the English × Light combination across all 10 real
screens (mobile tabs + web routes) is testable today — see
`test-matrix/test-matrix.csv`.

**Note on `/news` and `/schemes`:** these two web routes exist only on
branch `feat/web-news-schemes-pages` (PR #7) as of this audit, not yet on
`main`. Included in the matrix since they're real, reviewed code — just
flag if testing before that PR merges.
