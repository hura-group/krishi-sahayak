---
title: "[P1] No Devanagari/Gujarati font bundled — Gujarati rendering is unreliable on mid-range Android"
labels: P1,infra-blocker,platform:android,lang:hi,lang:gu,qa-sweep
---

## Severity
**P1 — must fix before launch.** Depends on P1-002 landing first, but should be scoped into the same effort rather than discovered afterward.

## Finding

```
$ find apps/mobile/assets -iname "*noto*" -o -iname "*devanagari*" -o -iname "*gujarati*"
(0 results)

$ cat apps/mobile/app.json | grep -i font
(no custom fonts registered)
```

No Indic-script font is bundled anywhere in `apps/mobile`. Once P1-002 lands and Hindi/Gujarati strings actually exist to render, they'll fall back to the OS system font.

**Why "mid-range Android" specifically matters here:** iOS and recent flagship Android ship reasonably complete Devanagari (Hindi) coverage in the system font. Gujarati coverage is meaningfully less consistent — budget/mid-range Android devices running older OS builds or OEM-skinned fonts (the price segment most of KrishiSahayak's actual users are likely to own) frequently render Gujarati as tofu boxes or substitute a low-quality fallback face, even when the OS claims locale support. A flagship device or simulator test would not catch this — it needs the specific device class named in the original test matrix request.

## Recommended fix
1. Bundle Noto Sans Devanagari and Noto Sans Gujarati as app assets (`expo-font` + `app.json` font config).
2. Apply conditionally based on active locale once P1-002 lands.
3. Verify specifically on a mid-range Android device, not just a simulator.

## Acceptance criteria
- [ ] Noto Sans Devanagari + Gujarati bundled and registered in `app.json`
- [ ] Font selection is locale-aware
- [ ] Verified on an actual mid-range Android device — no tofu/missing-glyph boxes

## References
- Depends on: P1-002 (i18n infrastructure)
- Audit evidence: `qa-sweep/audit-log.md`
