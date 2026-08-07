#!/usr/bin/env python3
"""
generate-icons.py

Regenerates every app icon / splash asset for KisanSathi from the four
master SVG sources in assets/icon-source/. Run this any time the design
changes — it is the single source of truth, equivalent to what
`expo-image-utils` or AppIcon.co would produce, but version-controlled
and reproducible in CI.

Usage:
    python3 scripts/generate-icons.py

Requires:
    - rsvg-convert  (apt-get install librsvg2-bin  /  brew install librsvg)
    - Pillow        (pip install Pillow)
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

# ─── Paths ──────────────────────────────────────────────────────────────────

ROOT        = Path(__file__).resolve().parent.parent
SRC         = ROOT / "assets" / "icon-source"
EXPO_OUT    = ROOT / "assets" / "images"            # what app.json points to
FULL_OUT    = ROOT / "assets" / "icon-full-sizes"    # complete legacy size sets
IOS_OUT     = FULL_OUT / "ios" / "AppIcon.appiconset"
AND_OUT     = FULL_OUT / "android"

SVG = {
    "master":      SRC / "icon-master.svg",
    "foreground":  SRC / "icon-adaptive-foreground.svg",
    "background":  SRC / "icon-adaptive-background.svg",
    "monochrome":  SRC / "icon-monochrome.svg",
}

# ─── Helpers ────────────────────────────────────────────────────────────────

def render(svg_path: Path, size: int, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["rsvg-convert", "-w", str(size), "-h", str(size),
         str(svg_path), "-o", str(out_path)],
        check=True,
    )

def flatten_on_white(png_path: Path, out_path: Path):
    """Removes alpha channel by compositing onto white — required by some
    store listing forms (e.g. Play Console icon must not have alpha)."""
    img = Image.open(png_path).convert("RGBA")
    bg  = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.alpha_composite(img)
    bg.convert("RGB").save(out_path)

# ─── 1. Expo-standard source files (what app.json references) ───────────────

def build_expo_sources():
    print("→ Building Expo source assets (assets/images/)…")
    render(SVG["master"],     1024, EXPO_OUT / "icon.png")
    render(SVG["foreground"], 1024, EXPO_OUT / "adaptive-icon-foreground.png")
    render(SVG["background"], 1024, EXPO_OUT / "adaptive-icon-background.png")
    render(SVG["monochrome"], 1024, EXPO_OUT / "adaptive-icon-monochrome.png")
    # Splash reuses the foreground mark (transparent) — Expo composites it
    # over `splash.backgroundColor` at runtime, no separate splash bg needed.
    render(SVG["foreground"], 1024, EXPO_OUT / "splash-icon.png")
    render(SVG["master"],       48, EXPO_OUT / "favicon.png")
    print("  ✓ 6 files written")

# ─── 2. iOS AppIcon.appiconset (full legacy set + Contents.json) ────────────

IOS_SIZES = [
    # (idiom, size_pt, scale, filename)
    ("iphone", 20, 2, "icon-20@2x.png"),  ("iphone", 20, 3, "icon-20@3x.png"),
    ("iphone", 29, 2, "icon-29@2x.png"),  ("iphone", 29, 3, "icon-29@3x.png"),
    ("iphone", 40, 2, "icon-40@2x.png"),  ("iphone", 40, 3, "icon-40@3x.png"),
    ("iphone", 60, 2, "icon-60@2x.png"),  ("iphone", 60, 3, "icon-60@3x.png"),
    ("ipad",   20, 1, "icon-20.png"),     ("ipad",   20, 2, "icon-20@2x-ipad.png"),
    ("ipad",   29, 1, "icon-29.png"),     ("ipad",   29, 2, "icon-29@2x-ipad.png"),
    ("ipad",   40, 1, "icon-40.png"),     ("ipad",   40, 2, "icon-40@2x-ipad.png"),
    ("ipad",   76, 1, "icon-76.png"),     ("ipad",   76, 2, "icon-76@2x.png"),
    ("ipad",   83.5, 2, "icon-83.5@2x.png"),
    ("ios-marketing", 1024, 1, "icon-1024.png"),
]

def build_ios():
    print("→ Building iOS AppIcon.appiconset…")
    images_json = []
    for idiom, size_pt, scale, filename in IOS_SIZES:
        px = round(size_pt * scale)
        render(SVG["master"], px, IOS_OUT / filename)
        images_json.append({
            "idiom":   idiom,
            "size":    f"{size_pt}x{size_pt}",
            "scale":   f"{int(scale)}x",
            "filename": filename,
        })

    contents = {
        "images": images_json,
        "info": {"version": 1, "author": "xcode"},
    }
    (IOS_OUT / "Contents.json").write_text(json.dumps(contents, indent=2))
    print(f"  ✓ {len(IOS_SIZES)} icon sizes + Contents.json")

# ─── 3. Android mipmaps (legacy + adaptive, all densities) ──────────────────

ANDROID_DENSITIES = {
    "mdpi":    48,
    "hdpi":    72,
    "xhdpi":   96,
    "xxhdpi":  144,
    "xxxhdpi": 192,
}
# Adaptive icon layers are drawn at 108dp per density (foreground/background
# canvas is larger than the legacy icon to allow for the system mask crop)
ADAPTIVE_SCALE = 108 / 48  # = 2.25x the legacy mdpi baseline per density

def build_android():
    print("→ Building Android mipmap-* (legacy + adaptive)…")
    for density, legacy_px in ANDROID_DENSITIES.items():
        folder = AND_OUT / f"mipmap-{density}"

        # Legacy launcher icon (square + round), used on API < 26
        render(SVG["master"], legacy_px, folder / "ic_launcher.png")
        render(SVG["master"], legacy_px, folder / "ic_launcher_round.png")

        # Adaptive icon layers (API 26+), drawn at 108dp equivalent
        adaptive_px = round(legacy_px * ADAPTIVE_SCALE)
        render(SVG["foreground"], adaptive_px, folder / "ic_launcher_foreground.png")
        render(SVG["background"], adaptive_px, folder / "ic_launcher_background.png")
        render(SVG["monochrome"], adaptive_px, folder / "ic_launcher_monochrome.png")

    # mipmap-anydpi-v26: XML descriptors that point Android to the adaptive layers
    anydpi = AND_OUT / "mipmap-anydpi-v26"
    anydpi.mkdir(parents=True, exist_ok=True)

    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
"""
    (anydpi / "ic_launcher.xml").write_text(adaptive_xml)
    (anydpi / "ic_launcher_round.xml").write_text(adaptive_xml)

    # Play Store listing icon — 512x512, no alpha
    tmp = AND_OUT / "_play_store_tmp.png"
    render(SVG["master"], 512, tmp)
    flatten_on_white(tmp, AND_OUT / "play-store-icon-512.png")
    tmp.unlink()

    print(f"  ✓ {len(ANDROID_DENSITIES)} densities × 5 files + adaptive XML + Play Store icon")

# ─── 4. Web favicon set ──────────────────────────────────────────────────────

def build_web():
    print("→ Building web favicon set…")
    web_out = FULL_OUT / "web"
    for size in [16, 32, 48, 192, 512]:
        render(SVG["master"], size, web_out / f"favicon-{size}.png")
    print("  ✓ 5 favicon sizes")

# ─── 5. Verification: safe-zone measurement ──────────────────────────────────

def verify_safe_zone():
    print("→ Verifying adaptive icon safe zone…")
    tmp = SRC / "_verify_tmp.png"
    render(SVG["foreground"], 1024, tmp)
    img = Image.open(tmp).convert("RGBA")
    alpha = img.split()[-1]
    import numpy as np
    arr = np.array(alpha)
    ys, xs = np.nonzero(arr)
    import math
    dists = [math.hypot(x - 512, y - 512) for x, y in zip(xs, ys)]
    max_r = max(dists) if dists else 0
    safe_r = 0.33 * 1024
    status = "PASS" if max_r <= safe_r else "FAIL"
    print(f"  Max mark radius: {max_r:.1f}px | Safe zone radius: {safe_r:.1f}px | {status}")
    tmp.unlink()
    if status == "FAIL":
        sys.exit("✗ Foreground mark exceeds the adaptive icon safe zone!")

# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"KisanSathi Icon Generator — output root: {ROOT}\n")
    verify_safe_zone()
    build_expo_sources()
    build_ios()
    build_android()
    build_web()
    print("\n✓ All icon assets generated successfully.")
    print(f"  Expo sources:  {EXPO_OUT.relative_to(ROOT)}")
    print(f"  Full size sets: {FULL_OUT.relative_to(ROOT)}")
