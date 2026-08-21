# -*- coding: utf-8 -*-
from pathlib import Path
import re

t = Path("index.html").read_text(encoding="utf-8")
m = re.search(r"<title>([^<]+)</title>", t)
title = m.group(1) if m else ""
Path("_t.txt").write_text(
    f"title={title}\nhex={title.encode('utf-8').hex()}\ncyr={sum(1 for c in t if chr(0x400)<=c<=chr(0x4FF))}\n",
    encoding="utf-8",
)

n = 0
for p in Path(".").glob("*.html"):
    raw = p.read_text(encoding="utf-8")
    nt = re.sub(
        r'styles\.css\?v=[^"]+',
        "styles.css?v=20260821-footer-light-v3",
        raw,
        count=1,
    )
    nt = re.sub(
        r"footer-dot-matrix\.js\?v=[^\"]+",
        "footer-dot-matrix.js?v=20260821-footer-fit-v1",
        nt,
    )
    if nt != raw:
        # preserve newline style
        nl = "\r\n" if "\r\n" in raw else "\n"
        p.write_bytes(nt.replace("\r\n", "\n").replace("\n", nl).encode("utf-8"))
        n += 1

Path("_t.txt").write_text(
    Path("_t.txt").read_text(encoding="utf-8") + f"bumped={n}\n",
    encoding="utf-8",
)
print("ok")
