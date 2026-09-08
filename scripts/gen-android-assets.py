#!/usr/bin/env python3
"""
Generate Android launcher icons and splash screens from the CheckMyPack mark.

The mark is drawn here in code (same geometry as src/components/Brand.tsx) so
the native icon and the in-app logo never drift apart.

    python3 scripts/gen-android-assets.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

RES = Path(__file__).resolve().parent.parent / "android/app/src/main/res"

GREEN = (46, 125, 50)
GREEN_DARK = (29, 83, 34)
WHITE = (255, 255, 255)


def draw_mark(size: int, bg: tuple | None = GREEN, inset: float = 0.0) -> Image.Image:
    """Scan reticle enclosing a package with a check, on a green tile."""
    ss = 4  # supersample for clean edges
    s = size * ss
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if bg is not None:
        radius = int(s * 0.22)
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=bg)

    # Content is inset so adaptive-icon masks never clip the artwork.
    pad = s * (0.22 + inset)
    box = s - 2 * pad
    x0, y0 = pad, pad

    def px(fx: float, fy: float) -> tuple[float, float]:
        return (x0 + fx * box, y0 + fy * box)

    lw = max(2, int(box * 0.055))

    # --- scan reticle corners -------------------------------------------
    arm = 0.26
    corner_col = (255, 255, 255, 150)
    for cx, cy, dx, dy in ((0, 0, 1, 1), (1, 0, -1, 1), (1, 1, -1, -1), (0, 1, 1, -1)):
        ax, ay = px(cx, cy)
        d.line([ax, ay, ax + dx * arm * box, ay], fill=corner_col, width=lw, joint="curve")
        d.line([ax, ay, ax, ay + dy * arm * box], fill=corner_col, width=lw, joint="curve")

    # --- package silhouette (solid white so the check reads as a cut-out) --
    pkg = [px(0.20, 0.34), px(0.50, 0.19), px(0.80, 0.34), px(0.80, 0.68), px(0.50, 0.83), px(0.20, 0.68)]
    d.polygon(pkg, fill=WHITE)

    # --- check mark, knocked out in the tile colour ------------------------
    knock = bg if bg is not None else GREEN
    chk = [px(0.35, 0.51), px(0.45, 0.62), px(0.66, 0.39)]
    d.line(chk, fill=knock, width=int(lw * 1.9), joint="curve")

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    # ---------------------------------------------------------- launcher
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in densities.items():
        out = RES / folder
        out.mkdir(parents=True, exist_ok=True)

        icon = draw_mark(size)
        icon.save(out / "ic_launcher.png")

        # round variant
        rnd = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        mask = Image.new("L", (size * 4, size * 4), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
        rnd.paste(icon, (0, 0), mask.resize((size, size), Image.LANCZOS))
        rnd.save(out / "ic_launcher_round.png")

        # adaptive foreground: transparent bg, extra inset for the mask
        fg_size = int(size * 108 / 48)
        draw_mark(fg_size, bg=None, inset=0.06).save(out / "ic_launcher_foreground.png")

    # ------------------------------------------------ adaptive icon xml
    anydpi = RES / "mipmap-anydpi-v26"
    anydpi.mkdir(parents=True, exist_ok=True)
    adaptive = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
    (anydpi / "ic_launcher.xml").write_text(adaptive)
    (anydpi / "ic_launcher_round.xml").write_text(adaptive)

    # ------------------------------------------------------------ splash
    splash_sizes = {
        "drawable": (480, 320),
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1600, 960),
        "drawable-land-xxxhdpi": (1920, 1280),
    }
    for folder, (w, h) in splash_sizes.items():
        out = RES / folder
        out.mkdir(parents=True, exist_ok=True)
        canvas = Image.new("RGB", (w, h), GREEN_DARK)
        mark_size = int(min(w, h) * 0.28)
        mark = draw_mark(mark_size, bg=None)
        canvas.paste(mark, ((w - mark_size) // 2, (h - mark_size) // 2), mark)
        canvas.save(out / "splash.png")

    print(f"Wrote launcher icons for {len(densities)} densities")
    print(f"Wrote splash screens for {len(splash_sizes)} configurations")


if __name__ == "__main__":
    main()
