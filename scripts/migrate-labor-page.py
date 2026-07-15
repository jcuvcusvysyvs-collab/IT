#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

# Remove labor block from about.html
about = ROOT / "about.html"
text = about.read_text(encoding="utf-8")
text = re.sub(
    r'\n      <!-- Блок 04: Сводные ведомости оценки условий труда -->.*?(?=\n      <!-- Блок 05: Карьера -->)',
    '',
    text,
    count=1,
    flags=re.DOTALL,
)
text = text.replace('<!-- Блок 05: Карьера -->', '<!-- Блок 04: Карьера -->')
text = text.replace('about-h-05', 'about-h-04')
text = text.replace('<span class="about-dce__index" aria-hidden="true">05</span>', '<span class="about-dce__index" aria-hidden="true">04</span>', 1)
text = text.replace('href="#labor"', 'href="labor-conditions.html"')
text = text.replace('href="about.html#labor"', 'href="labor-conditions.html"')
about.write_text(text, encoding="utf-8", newline="\n")
print("Updated about.html")

# Sitewide footer link update
count = 0
for path in ROOT.glob("*.html"):
    if path.name == "client-projects.html":
        continue
    t = path.read_text(encoding="utf-8")
    new = t.replace('href="about.html#labor"', 'href="labor-conditions.html"')
    new = new.replace('href="#labor"', 'href="labor-conditions.html"')
    if new != t:
        path.write_text(new, encoding="utf-8", newline="\n")
        count += 1
print(f"Updated footer links in {count} files")

# Update add-footer-labor-link script default href
script = ROOT / "scripts" / "add-footer-labor-link.py"
s = script.read_text(encoding="utf-8")
s = s.replace('href="#labor" if path.name == "about.html" else "about.html#labor"', 'href="labor-conditions.html"')
script.write_text(s, encoding="utf-8", newline="\n")
