---
title: "[P1] Dark mode scaffold exists but is unbranded and unused by every real screen"
labels: P1,infra-blocker,theme:dark,qa-sweep
---

## Severity
**P1 — must fix before launch.** Affects every screen in `apps/mobile` (the dark-mode column for all 60 cells in the test matrix).

## Finding

This is a correction of an earlier draft of this issue that audited the wrong codebase. Re-verified directly against `hura-group/krishi-sahayak`:

A theme scaffold **does** exist — `apps/mobile/constants/theme.ts` defines a real `Colors.light` / `Colors.dark` object, paired with `useColorScheme()` (`apps/mobile/hooks/use-color-scheme.ts`) and `ThemedView`/`ThemedText` components. This is Expo's standard starter-template pattern, intact and unmodified.

Two problems with it as it stands:

**1. It's still the Expo starter template's placeholder colors, not KrishiSahayak's brand:**
```js
// apps/mobile/constants/theme.ts
const tintColorLight = '#0a7ea4';   // Expo default teal, not brand
const tintColorDark = '#fff';
```

**2. None of the three real feature areas consume it at all:**
```
$ grep -l "useThemeColor\|ThemedView\|ThemedText" components/MarketFilter components/PriceAlerts components/MandiLocator -r
(0 results)

$ grep -rc "#[0-9A-Fa-f]\{6\}" components/MarketFilter components/PriceAlerts components/MandiLocator
MarketFilter:  FilterPanel.tsx (13), FilterChips.tsx (5), MarketPriceList.tsx (3), MarketPriceCard.tsx (5)
PriceAlerts:   PriceAlertCard.tsx (8), CreateAlertSheet.tsx (23), AlertHistoryItem.tsx (6), EmptyAlerts.tsx (2)
MandiLocator:  MandiMarker.tsx (3), MandiBottomSheet.tsx (17), MandiListItem.tsx (7), RadiusSelector.tsx (5)
```
97 hardcoded hex color instances across the three real, shipped feature areas. Example, `FilterPanel.tsx`:
```js
title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
doneBtn: { ..., backgroundColor: '#2D7A3A', ... },
```
A user with system dark mode on will see these exact light-mode colors regardless — full-brightness white-ish backgrounds and dark text, the textbook "looks broken in dark mode" bug, across all three feature tabs.

## Recommended fix
1. Replace the Expo-default tint/background values in `constants/theme.ts` with the real KrishiSahayak brand palette (light + dark variants).
2. Migrate `MarketFilter`, `PriceAlerts`, and `MandiLocator` — 12 files, 97 instances — from hardcoded hex to `useThemeColor()`.
3. Re-run the dark-mode column of the test matrix once this lands.

## Acceptance criteria
- [ ] `constants/theme.ts` uses real brand colors, not Expo starter defaults
- [ ] Zero hardcoded hex colors remain in `MarketFilter`, `PriceAlerts`, `MandiLocator`
- [ ] Manually spot-checked in dark mode on a real device before closing

## References
- Test matrix: `qa-sweep/test-matrix/test-matrix.csv`
- Audit evidence: `qa-sweep/audit-log.md`
