from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

LABOR_LINK = '''            <a class="footer-legal__link" href="{href}">
              Сводные ведомости оценки условий труда
              <svg class="footer-legal__icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6h7.5M7 3.75l2.25 2.25L7 8.25" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>'''

PATTERN = re.compile(
    r'(            <a class="footer-legal__link" href="images/documents/persdata_policy\.pdf"[^>]*>.*?</a>)(\s*</nav>)',
    re.DOTALL,
)


def update_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if 'footer-legal__link" href="labor-conditions.html"' in text:
        return False

    href = "labor-conditions.html"
    link = LABOR_LINK.format(href=href)

    def repl(match: re.Match[str]) -> str:
        return match.group(1) + "\n" + link + match.group(2)

    new_text, count = PATTERN.subn(repl, text, count=1)
    if count == 0:
        return False

    path.write_text(new_text, encoding="utf-8", newline="\n")
    return True


def main() -> None:
    changed = []
    for path in sorted(ROOT.glob("*.html")):
        if path.name == "client-projects.html":
            continue
        if update_file(path):
            changed.append(path.name)

    print(f"Updated {len(changed)} files")


if __name__ == "__main__":
    main()
