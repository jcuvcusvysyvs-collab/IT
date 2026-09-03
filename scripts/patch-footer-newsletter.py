"""Sync footer partials and inject footer-newsletter.js across HTML pages."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTIALS = ROOT / "_partials"
ASSETS_PATH = Path(__file__).resolve().parent / "site-assets.json"

FOOTER_RE = re.compile(r'[ \t]*<footer class="site-footer"[\s\S]*?</footer>\s*', re.M)


def load_footer(name: str) -> str:
    return (PARTIALS / name).read_text(encoding="utf-8")


def ensure_script(text: str, filename: str, version: str) -> str:
    src = f'{filename}?v={version}'
    if f'src="{filename}' in text or f"src='{filename}" in text:
        return re.sub(
            rf'(src=["\']){re.escape(filename)}(?:\?v=[^"\']*)?(["\'])',
            rf"\1{src}\2",
            text,
        )
    return text.replace(
        "</body>",
        f'    <script defer src="{src}"></script>\n  </body>',
        1,
    )


def main() -> int:
    assets = json.loads(ASSETS_PATH.read_text(encoding="utf-8"))
    version = assets["footer-newsletter.js"]
    home_footer = load_footer("footer-home.html")
    sub_footer = load_footer("footer-subpage.html")
    changed: list[str] = []

    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        orig = text
        footer = home_footer if path.name == "index.html" else sub_footer
        if '<footer class="site-footer"' in text:
            text, n = FOOTER_RE.subn(footer, text, count=1)
            if n != 1:
                continue
        text = ensure_script(text, "footer-newsletter.js", version)
        if "styles.css" in assets:
            text = re.sub(
                r'(href=["\'])styles\.css(?:\?v=[^"\']*)?(["\'])',
                rf"\1styles.css?v={assets['styles.css']}\2",
                text,
            )
        if text != orig:
            path.write_text(text, encoding="utf-8", newline="\n")
            changed.append(path.name)

    print(f"Synced footer newsletter strip in {len(changed)} HTML files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
