#!/usr/bin/env python3
"""Generate favicon assets from images/favicon/logoVertical.webp and inject into HTML heads."""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "images" / "favicon" / "logoVertical.webp"
OUT_DIR = ROOT / "images" / "favicon"

FAVICON_BLOCK = (
    '    <link rel="icon" href="images/favicon/favicon.ico" sizes="any" />\n'
    '    <link rel="icon" type="image/png" href="images/favicon/favicon-32x32.png" sizes="32x32" />\n'
    '    <link rel="icon" type="image/webp" href="images/favicon/logoVertical.webp" sizes="any" />\n'
    '    <link rel="apple-touch-icon" href="images/favicon/apple-touch-icon.png" />'
)

# Existing favicon-related links in <head> (for replace)
FAVICON_RE = re.compile(
    r"[ \t]*<link\s+rel=[\"'](?:icon|shortcut icon|apple-touch-icon)[\"'][^>]*>\s*",
    re.I,
)

VIEWPORT_RE = re.compile(
    r"<meta\s+name=[\"']viewport[\"'][^>]*/?>",
    re.I,
)


def resize_rgba(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def generate_assets() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Source not found: {SRC}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGBA")

    ico_sizes = [16, 32, 48]
    ico_images = [resize_rgba(src, s) for s in ico_sizes]
    ico_path = OUT_DIR / "favicon.ico"
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:],
    )

    png32 = resize_rgba(src, 32)
    png32.save(OUT_DIR / "favicon-32x32.png", format="PNG", optimize=True)

    apple = resize_rgba(src, 180)
    apple.save(OUT_DIR / "apple-touch-icon.png", format="PNG", optimize=True)

    print("Generated:")
    for name in ("favicon.ico", "favicon-32x32.png", "apple-touch-icon.png"):
        p = OUT_DIR / name
        print(f"  {p.relative_to(ROOT)} ({p.stat().st_size} bytes)")


def _after_viewport_newline(text: str, end: int) -> int:
    """Advance past optional spaces and one newline after the viewport meta."""
    pos = end
    while pos < len(text) and text[pos] in " \t":
        pos += 1
    if pos < len(text) and text[pos] == "\r":
        pos += 1
    if pos < len(text) and text[pos] == "\n":
        pos += 1
    return pos


def inject_html() -> None:
    pages = sorted(ROOT.glob("*.html"))
    updated = 0
    skipped = 0

    for path in pages:
        text = path.read_text(encoding="utf-8")
        cleaned = FAVICON_RE.sub("", text)

        m = VIEWPORT_RE.search(cleaned)
        if not m:
            print("SKIP (no viewport):", path.name)
            skipped += 1
            continue

        pos = _after_viewport_newline(cleaned, m.end())
        # Restore indent if a previous buggy inject ate spaces before <title>/<meta>/…
        if pos < len(cleaned) and cleaned[pos] == "<":
            cleaned = cleaned[:pos] + "    " + cleaned[pos:]
        new_text = cleaned[:pos] + FAVICON_BLOCK + "\n" + cleaned[pos:]

        if new_text != text:
            path.write_text(new_text, encoding="utf-8", newline="\n")
            updated += 1
            print("ok", path.name)
        else:
            skipped += 1

    print(f"HTML: updated {updated}, skipped {skipped}, total {len(pages)}")


def main() -> None:
    generate_assets()
    inject_html()


if __name__ == "__main__":
    main()
