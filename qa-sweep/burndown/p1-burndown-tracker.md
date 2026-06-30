# P1 Burndown Tracker — Target: Zero by End of Week 15

## Current state (Week N — fill in actual week number)

| Metric | Count |
|---|---|
| P1 issues open | 3 |
| P2 issues open | 0 (none filed yet — expected once the 10 testable English/Light cells are actually run) |
| Test matrix cells testable today | 10 / 60 (17%) |
| Test matrix cells blocked | 50 / 60 (83%) |

## The 3 open P1s

| ID | Title | Blocks | Status |
|---|---|---|---|
| P1-001 | Dark mode unbranded + unused by real screens | 36 matrix cells | Open |
| P1-002 | No i18n infrastructure | 40 matrix cells | Open |
| P1-003 | No Indic script font bundled | Depends on P1-002 | Open |

(P1-001 and P1-002 overlap on rows that are both Dark AND Hindi/Gujarati —
36 + 40 minus 26 overlap = 50 unique blocked cells, matching the audit total.)

## Recommended sequencing

```
P1-002 (i18n)      ──┬──→ P1-003 (Indic fonts) ──┐
                     │                            ├──→ Full matrix testable
P1-001 (dark mode) ──┴────────────────────────────┘
```

P1-001 and P1-002 can be worked in parallel — different files, no overlap.
P1-003 is blocked on P1-002 landing first; don't assign it until translated
strings actually exist to render.

## Burndown log

Update every Friday. It's fine for the count to hold flat for a sprint
while P1-001/002 are being built, then drop once they land and unblock the
real device sweep — which will surface its own new P1s. That's expected,
not a regression.

| Week | P1 Open | P2 Open | Matrix Cells Testable | Notes |
|---|---|---|---|---|
| 12 | 3 | 0 | 10/60 | Pre-flight code audit complete (re-run against the real repo on 2026-06-28), 3 infra blockers filed |
| 13 | _ | _ | _/60 | |
| 14 | _ | _ | _/60 | |
| 15 | 0 (target) | _ | 60/60 (target) | Launch readiness checkpoint |

## What "zero P1 by Week 15" actually requires

P1-002 in particular is not a quick wire-up — translating every string
across `MarketFilter`, `PriceAlerts`, `MandiLocator`, the tab screens, and
the 4 web routes into two languages, with a native-speaker review pass for
agricultural terminology (mandi, MSP, quintal, APMC), has a human-in-the-loop
bottleneck engineering velocity alone can't compress. If Week 15 is a hard
date, surface this to whoever owns it now, not in Week 14.

## How to update this after each gh issue change

```bash
gh issue list --repo hura-group/krishi-sahayak --label P1 --state open --json number | jq length
gh issue list --repo hura-group/krishi-sahayak --label P2 --state open --json number | jq length
```
