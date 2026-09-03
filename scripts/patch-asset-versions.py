"""Update shared CSS/JS cache-buster versions from site-assets.json."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS_PATH = Path(__file__).resolve().parent / "site-assets.json"


def main() -> int:
    assets: dict[str, str] = json.loads(ASSETS_PATH.read_text(encoding="utf-8"))
    changed: list[str] = []

    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        orig = text
        for name, version in assets.items():
            if name.endswith(".css"):
                text = re.sub(
                    rf'(href=["\']){re.escape(name)}(?:\?v=[^"\']*)?(["\'])',
                    rf"\1{name}?v={version}\2",
                    text,
                )
            elif name.endswith(".js") and name not in (
                "footer-dot-matrix.js",
                "footer-mos-widget.js",
                "footer-newsletter.js",
                "scroll-top.js",
                "cookie-banner.js",
                "header-callback.js",
            ):
                text = re.sub(
                    rf'(src=["\']){re.escape(name)}(?:\?v=[^"\']*)?(["\'])',
                    rf"\1{name}?v={version}\2",
                    text,
                )
        if text != orig:
            path.write_text(text, encoding="utf-8", newline="\n")
            changed.append(path.name)

    print(f"Updated asset versions in {len(changed)} HTML files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
