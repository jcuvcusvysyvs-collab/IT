#!/usr/bin/env python3
"""Sync footer markup from _partials across all HTML pages."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME_FOOTER = (ROOT / "_partials" / "footer-home.html").read_text(encoding="utf-8").strip() + "\n"
SUB_FOOTER = (ROOT / "_partials" / "footer-subpage.html").read_text(encoding="utf-8").strip() + "\n"

FOOTER_RE = re.compile(r"[ \t]*<footer class=\"site-footer\"[\s\S]*?</footer>\s*", re.M)
STYLES_VER = "20260821-footer-light-v14"
RAIL_VER = "20260821-footer-rail-v1"
MOS_VER = "20260821-mos-widget-v3"


def ensure_script(text: str, src: str) -> str:
    if src.split("?")[0] in text:
        # bump version if present
        base = src.split("?")[0]
        return re.sub(
            rf'{re.escape(base)}\?v=[^"]+',
            src,
            text,
        )
    return text.replace(
        "</body>",
        f'    <script defer src="{src}"></script>\n  </body>',
        1,
    )


def main() -> None:
    updated = 0
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        if '<footer class="site-footer"' not in text:
            continue
        footer = HOME_FOOTER if path.name == "index.html" else SUB_FOOTER
        replacement = footer if footer.startswith("    <footer") else "    " + footer.lstrip()
        new_text, n = FOOTER_RE.subn(replacement, text, count=1)
        if n != 1:
            print("skip", path.name, "matches", n)
            continue

        new_text = re.sub(
            r'href="styles\.css\?v=[^"]+"',
            f'href="styles.css?v={STYLES_VER}"',
            new_text,
            count=1,
        )
        new_text = ensure_script(new_text, f"footer-dot-matrix.js?v={RAIL_VER}")
        new_text = ensure_script(new_text, f"footer-mos-widget.js?v={MOS_VER}")

        path.write_text(new_text, encoding="utf-8", newline="\n")
        updated += 1
        print("ok", path.name)
    print("updated", updated)


if __name__ == "__main__":
    main()
