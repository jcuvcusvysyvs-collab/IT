#!/usr/bin/env python3
"""Insert page-share block after form sections on service pages."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTIAL = (ROOT / "_partials" / "page-share.html").read_text(encoding="utf-8").strip()
SHARE_BLOCK = "\n".join("      " + line if line else "" for line in PARTIAL.splitlines()) + "\n"
SCRIPT_TAG = '    <script defer src="page-share.js?v=20260825-share-v1"></script>\n'

PAGES = [
    "infrastructure-solutions.html",
    "information-security.html",
    "scaling-without-procurement.html",
    "business-continuity.html",
    "operations-support.html",
    "huawei-service-center.html",
    "asdu-datacenter.html",
]

# After closing form section, before wrapper </div> / </main>
FORM_SECTION_CLOSE = re.compile(
    r"(</section>\s*)(</div>\s*</main>)",
    re.M,
)


def ensure_script(text: str) -> str:
    if "page-share.js" in text:
        return re.sub(
            r'page-share\.js\?v=[^"]+',
            "page-share.js?v=20260825-share-v1",
            text,
        )
    # Insert before footer scripts if present, else before </body>
    if "footer-dot-matrix.js" in text:
        return text.replace(
            '<script defer src="footer-dot-matrix.js',
            SCRIPT_TAG.rstrip() + "\n    " + '<script defer src="footer-dot-matrix.js',
            1,
        )
    return text.replace("</body>", SCRIPT_TAG + "  </body>", 1)


def main() -> None:
    for name in PAGES:
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        if 'class="section page-share"' in text:
            print("skip (exists)", name)
        else:
            new_text, n = FORM_SECTION_CLOSE.subn(
                r"\1\n" + SHARE_BLOCK + r"\2",
                text,
                count=1,
            )
            if n != 1:
                print("FAIL insert", name, "matches", n)
                continue
            text = new_text
            print("inserted", name)

        text = ensure_script(text)
        path.write_text(text, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
