# -*- coding: utf-8 -*-
from pathlib import Path
import re

root = Path(r"c:\Users\skislinskiy.SKISLINSKIY\Desktop\Сайт ДИСИ_rabochiy")
svg_path = root / "images" / "data server room.svg"
html_path = root / "about.html"

svg = svg_path.read_text(encoding="utf-8")
# drop xml decl
svg = re.sub(r"^<\?xml[^>]*>\s*", "", svg)
# add classes / a11y on root svg
svg = svg.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 190.2 173.3">',
    '<svg class="about-iso__svg" role="img" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 190.2 173.3">',
    1,
)
# mark caps for animation
for i in range(1, 5):
    old = f'id="_Шапка_x5F_{i}" data-name="Шапка_x5F_{i}" class="cls-35"'
    new = f'id="_Шапка_x5F_{i}" data-name="Шапка_x5F_{i}" class="cls-35 about-iso-cap about-iso-cap--{i}"'
    if old not in svg:
        raise SystemExit(f"cap {i} not found")
    svg = svg.replace(old, new, 1)

html = html_path.read_text(encoding="utf-8")
start = html.find('<svg class="about-iso__svg"')
if start < 0:
    # current may not have class on first line the same way
    start = html.find('<div class="about-iso__stage" data-depth="14">')
    if start < 0:
        raise SystemExit("stage not found")
    start = html.find("<svg", start)
end = html.find("</svg>", start)
if start < 0 or end < 0:
    raise SystemExit(f"svg bounds {start} {end}")
end += len("</svg>")

# indent svg under stage
indented = "\n".join(
    ("                      " + line if line.strip() else line)
    for line in svg.strip().splitlines()
)

out = html[:start] + indented + html[end:]
tmp = html_path.with_suffix(".html.tmp")
tmp.write_text(out, encoding="utf-8")
print("prepared", len(svg), "->", tmp.name)
