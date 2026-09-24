# App Icon + Branding — KisanSathi

Final production icon, splash screen, and adaptive icon system. Vector source
included so the mark can be edited or recolored without starting over.

---

## Design concept

Three leaf shapes — one vertical blade and two branching leaves — arranged to
read simultaneously as **a leaf cluster** and **the letter "K"**. The small
center node represents where leaf stems join, tying the mark back to its
agricultural meaning rather than being an arbitrary monogram.

| Token | Hex | Use |
|---|---|---|
| `icon-bg-start` | `#0F5238` | Background gradient, top-left |
| `icon-bg-end` | `#003925` | Background gradient, bottom-right (brand primary) |
| `icon-mark-start` | `#B0F1CD` | Leaf gradient, light stop |
| `icon-mark-end` | `#4CAF82` | Leaf gradient, dark stop |
| `icon-node` | `#0A3D29` | Center joint dot |

These pair with the existing KisanSathi design system (`primary: #003925`,
`tertiary-fixed: #b0f0ce`) — the icon uses the same emerald family, just
tuned slightly for icon-scale contrast.

---

## File structure

```
assets/
├── icon-source/                          ← EDIT THESE — hand-authored SVGs
│   ├── icon-master.svg                   (background + mark, full bleed)
│   ├── icon-adaptive-foreground.svg      (mark only, safe-zone scaled)
│   ├── icon-adaptive-background.svg      (gradient only, no mark)
│   └── icon-monochrome.svg               (white silhouette, Android 13+)
│
├── images/                                ← Expo reads these via app.json
│   ├── icon.png                          (1024×1024 — iOS / general)
│   ├── adaptive-icon-foreground.png      (1024×1024, transparent)
│   ├── adaptive-icon-background.png      (1024×1024)
│   ├── adaptive-icon-monochrome.png      (1024×1024, transparent)
│   ├── splash-icon.png                   (reuses the foreground mark)
│   └── favicon.png                       (48×48, web)
│
└── icon-full-sizes/                       ← Bonus: pre-rendered legacy sets
    ├── ios/AppIcon.appiconset/           (18 sizes + Contents.json)
    ├── android/mipmap-{m,h,xh,xxh,xxxh}dpi/  (legacy + adaptive, 5 densities)
    ├── android/mipmap-anydpi-v26/        (adaptive icon XML descriptors)
    ├── android/play-store-icon-512.png   (alpha-flattened, Play Console-ready)
    └── web/favicon-{16,32,48,192,512}.png

scripts/
└── generate-icons.py                      ← regenerates everything above

app.config.icon-snippet.json               ← merge into your app.json
icon_device_test_report.png                ← visual QA: dark Android + white iOS
splash_preview.png                          ← splash screen preview
```

---

## How the two delivery tracks differ

**`assets/images/`** is what your `app.json` actually points to. This is all
Expo needs — when you run `eas build` or `expo prebuild`, Expo/EAS
auto-generates every iOS and Android density variant from these single
1024px sources. This is the modern, recommended workflow and the only
folder you need to wire up for the app to build correctly.

**`assets/icon-full-sizes/`** is a bonus, pre-rendered set replicating
exactly what `expo-image-utils` (the library behind `expo prebuild`) or
AppIcon.co would output — every iOS point/scale combination, every Android
density bucket, the Play Store listing icon, and a web favicon set. Useful
for: manual store-listing uploads, marketing/press kits, GitHub social
preview images, or bare React Native projects without EAS. You do not need
to wire this into app.json — Expo doesn't read from it.

---

## Setup — merge into your app.json

```bash
# Copy the asset folders into your project root (skip if already there)
cp -r assets/icon-source assets/images  ./your-app/assets/

# Merge the config (see app.config.icon-snippet.json for the full block)
```

Required Expo packages for the splash screen plugin:
```bash
npx expo install expo-splash-screen
```

**SDK version note:** SDK 50+ uses the `expo-splash-screen` config *plugin*
(shown in the snippet). On SDK ≤49, use the legacy top-level `"splash"` key
instead — see comments in `app.config.icon-snippet.json`. Don't use both.

**Android themed icon note:** `monochromeImage` (Android 13+ Material You
tinting) requires Expo SDK 51+. On older SDKs, just omit that line — Android
will fall back to the standard adaptive icon without themed tinting.

After merging config:
```bash
npx expo prebuild --clean   # regenerates native ios/ and android/ folders
```

---

## Regenerating assets after a design change

Everything is reproducible from the four SVGs in `assets/icon-source/`.
Never hand-edit a PNG — edit the SVG and re-run the script.

```bash
# Dependencies (one-time)
sudo apt-get install -y librsvg2-bin     # provides rsvg-convert
pip install Pillow numpy

# Regenerate everything
python3 scripts/generate-icons.py
```

The script also re-verifies the adaptive icon safe zone on every run and
will **fail loudly** if a future edit pushes the mark outside the 66% circle
that Android's various OEM masks (circle, squircle, rounded-square,
teardrop) crop to.

---

## Adaptive icon safe zone (verified)

| Metric | Value |
|---|---|
| Canvas | 1024 × 1024 |
| Safe-zone radius (66% rule) | 337.9 px |
| Actual mark max radius | 289.4 px |
| Margin | 48.5 px (14%) |

This margin means the mark stays fully visible under every common OEM mask
shape — see `icon_device_test_report.png` for circle (Pixel/AOSP),
rounded-square (Samsung One UI), and squircle variants side by side.

---

## Visual QA — `icon_device_test_report.png`

A single combined image verifying legibility in the two environments
requested, plus two bonus "in context" rows:

1. **Dark Android wallpaper** — icon rendered under 3 different OEM mask
   shapes (circle, rounded-square, squircle), confirming the mark and its
   safe-zone margin hold up regardless of launcher.
2. **Android home screen row** — the icon sitting among 4 generic neighbor
   icons, to check it doesn't look out of place or low-contrast in situ.
3. **White iOS background** — squircle-masked icon, the raw unmasked 1024px
   source for reference, and a bordered card variant.
4. **iOS home screen row** — same in-context check for the light theme.

At every size tested — from 1024px down to a 16px favicon — the K silhouette
stays legible (see the small-size legibility check below).

**Honesty note on scope:** this is a rendered visual mockup built from the
actual generated PNGs and accurate platform mask geometry (circle, Apple's
~22.4% squircle radius, etc.) — it is the right way to verify contrast and
safe-zone behavior pre-build. It is **not** a substitute for a final check
on a real device or simulator once the app is built; OEM launchers
occasionally apply icon shape *and* a slight outer shadow/border the OS
adds at runtime that's only fully visible after `eas build`. Treat this as
the design QA gate, and do one quick physical-device glance after your
first TestFlight/Internal Testing build as the final sign-off.

---

## Small-size legibility check

| Context | Rendered size | Result |
|---|---|---|
| iOS notification icon | 40×40 | ✅ Clear |
| Android mdpi launcher | 48×48 | ✅ Clear |
| Web favicon | 16×16 | ✅ Legible (slightly soft, expected at this size) |

---

## Splash screen

`splash-icon.png` reuses the adaptive-icon foreground mark (transparent,
already safe-zone scaled) over `backgroundColor: #003925` — no separate
splash background image needed. See `splash_preview.png` for the rendered
result at phone aspect ratio.

---

## Editing the mark later

All three leaf shapes are the same symmetric "vesica" formula, just resized,
rotated, and translated — so resizing the whole mark, recoloring, or
adjusting leaf angles is a small edit to `icon-source/icon-master.svg`:

```
Leaf formula (tip-to-tip, height H, max half-width W, centered at origin):
M 0,-H  C W,-H*0.55  W,H*0.55   0,H
        C -W,H*0.55  -W,-H*0.55  0,-H  Z
```

After any edit, re-run `scripts/generate-icons.py` — it will tell you
immediately if the new shape breaks the safe zone.

---

## Pre-launch checklist

- [ ] Merge `app.config.icon-snippet.json` into your real `app.json`
- [ ] Run `npx expo install expo-splash-screen`
- [ ] Run `npx expo prebuild --clean`
- [ ] Confirm `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` was generated
- [ ] Build once via EAS (`eas build --profile development`) and glance at the real icon on a physical device
- [ ] Upload `assets/icon-full-sizes/android/play-store-icon-512.png` to Play Console listing
- [ ] Upload `assets/icon-full-sizes/ios/AppIcon.appiconset/icon-1024.png` to App Store Connect listing
