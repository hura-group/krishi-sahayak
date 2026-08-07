# Polish QA Sweep

Test matrix, issue template, labels, and Week 15 P1 tracking for the
English/Hindi/Gujarati × Light/Dark × Android/iOS/Web visual QA pass on
`hura-group/krishi-sahayak`.

## Read this first — honest scope note

This asked for Member C to test every screen on real devices and file
bugs. I'm Claude — no physical phone, no compiled app, no way to look at a
running screen myself. Inventing plausible-sounding bug reports instead of
saying so would waste Member C's time re-verifying fake findings.

What I did instead: a static code audit against the actual `apps/mobile`
and `apps/web` source in this repo, which found something that reframes
the whole sweep — dark mode and Hindi/Gujarati localization are not wired
into any real screen yet, so 50 of the 60 cells in the requested test
matrix are currently impossible to test, not just untested.

**Correction note:** an earlier draft of this package was built against a
different, unrelated codebase before this repo was cloned and inspected
directly. That draft has been fully discarded — every file in this folder
was verified against the real `hura-group/krishi-sahayak` source as of
2026-06-28. See `audit-log.md` for the exact commands run.

So this is split into two phases:
- **Phase 0 (done — this delivery):** code audit, 3 real P1 issues filed
  with file/line evidence, 60-row test matrix generated with the 50 blocked
  cells pre-flagged.
- **Phase 1 (Member C, once P1-001/002 land):** the actual device-based
  visual sweep.

## File structure

```
qa-sweep/
├── README.md
├── audit-log.md                            ← raw commands + evidence, this repo
├── .github/ISSUE_TEMPLATE/
│   ├── visual-bug.yml
│   └── config.yml
├── labels/setup-labels.sh
├── test-matrix/
│   ├── generate-matrix.js                  ← real 10-screen inventory (mobile + web)
│   └── test-matrix.csv                     ← 60 rows, 50 pre-flagged blocked
├── findings/
│   ├── P1-001-dark-mode-unbranded-and-unused.md
│   ├── P1-002-no-i18n-infrastructure.md
│   ├── P1-003-no-indic-font-bundled.md
│   └── file-issues.sh
└── burndown/p1-burndown-tracker.md
```

## Setup — 3 commands

```bash
gh auth login

./labels/setup-labels.sh hura-group/krishi-sahayak
./findings/file-issues.sh hura-group/krishi-sahayak

cp -r .github ../.github   # if running from inside qa-sweep/, copies to repo root
```

## What Member C does (Phase 1, once unblocked)

1. Open `test-matrix/test-matrix.csv`.
2. Filter to rows where status = "Not started" — today, the 10 English ×
   Light rows across the 6 mobile tabs and 4 web routes.
3. For each row: set language/theme, open the screen, compare against the
   linked source file.
4. Bug found → file via the **Visual Bug** issue template.
5. Update the matrix cell: `Pass` or `Fail (#issue-number)`.

## Severity definitions

- **P1 — must fix before launch.** Blocks a core flow, looks visibly
  broken/unfinished, or affects every instance of a screen.
- **P2 — launch later.** Cosmetic, narrow edge case, low-traffic screen.

Default to P2 when in doubt — let triage upgrade it. Inflating the P1 count
erodes what "P1" signals to the team.
