#!/usr/bin/env python3
"""Replace page-share block markup from _partials/page-share.html on service pages."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTIAL = (ROOT / "_partials" / "page-share.html").read_text(encoding="utf-8").strip()
SHARE_BLOCK = "\n".join(("      " + line if line else "") for line in PARTIAL.splitlines())

PAGES = [
    "infrastructure-solutions.html",
    "information-security.html",
    "scaling-without-procurement.html",
    "business-continuity.html",
    "operations-support.html",
    "huawei-service-center.html",
    "asdu-datacenter.html",
]

SHARE_RE = re.compile(
    r"[ \t]*<section class=\"section page-share\"[\s\S]*?</section>",
    re.M,
)


def main() -> None:
    for name in PAGES:
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        new_text, n = SHARE_RE.subn(SHARE_BLOCK, text, count=1)
        if n != 1:
            print("FAIL", name, "matches", n)
            continue
        path.write_text(new_text, encoding="utf-8", newline="\n")
        print("ok", name)


if __name__ == "__main__":
    main()
