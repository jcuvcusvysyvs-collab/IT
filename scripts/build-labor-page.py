#!/usr/bin/env python3
"""Generate labor-conditions.html from contacts.html shell."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
contacts = (ROOT / "contacts.html").read_text(encoding="utf-8")

nav_match = re.search(
    r'<nav class="nav" aria-label="Основное меню">.*?</nav>',
    contacts,
    re.DOTALL,
)
footer_match = re.search(r'<footer class="site-footer">.*?</footer>', contacts, re.DOTALL)
header_match = re.search(
    r'<header class="site-header">.*?</header>',
    contacts,
    re.DOTALL,
)

if not (nav_match and footer_match and header_match):
    raise SystemExit("Could not extract shell from contacts.html")

header = header_match.group(0)
footer = footer_match.group(0)
footer = footer.replace('href="about.html#labor"', 'href="labor-conditions.html"')
footer = footer.replace('aria-current="page"', '')

main = '''
    <main id="main">
      <header class="subpage-hero subpage-hero--about projects-hero" data-subpage-hero aria-labelledby="labor-page-title">
        <div class="subpage-hero__inner">
          <div class="subpage-hero__content">
            <nav class="subpage-breadcrumbs" aria-label="Хлебные крошки">
              <ol class="subpage-breadcrumbs__list">
                <li class="subpage-breadcrumbs__item">
                  <a class="subpage-breadcrumbs__link" href="index.html#top">Главная&nbsp;страница</a>
                </li>
                <li class="subpage-breadcrumbs__item">
                  <a class="subpage-breadcrumbs__link" href="about.html">О&nbsp;компании</a>
                </li>
                <li class="subpage-breadcrumbs__item" aria-current="page">
                  Сводные ведомости оценки условий труда
                </li>
              </ol>
            </nav>
            <h1 id="labor-page-title" class="subpage-hero__title">
              <span class="subpage-hero__title-line">Сводные ведомости</span>
              <span class="subpage-hero__title-line">оценки условий труда</span>
            </h1>
          </div>
        </div>
      </header>

      <section class="page-labor__section" id="labor-content" aria-labelledby="labor-panel-title">
        <div class="page-labor__inner">
          <article class="page-labor__panel" data-feature-reveal>
            <header class="page-labor__panel-head">
              <h2 id="labor-panel-title" class="page-labor__panel-title">Сводные ведомости оценки условий труда</h2>
              <p class="page-labor__intro">
                Согласно отчёту о&nbsp;проведении специальной оценки труда на&nbsp;рабочих местах работников
                установлен <strong>2&nbsp;класс (подкласс)</strong> условий труда. Рекомендуемые мероприятия
                по&nbsp;улучшению условий труда отсутствуют.
              </p>
            </header>

            <div class="page-labor__groups">
              <details class="page-labor__group" open>
                <summary class="page-labor__group-toggle">2026</summary>
                <div class="page-labor__group-body">
                  <div class="page-labor__group-inner">
                    <ul class="page-labor__cards">
                  <li>
                    <a
                      class="page-labor__doc-card"
                      href="images/documents/COUT_2026.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span class="page-labor__doc-title">Сводная ведомость оценки условий труда</span>
                      <span class="page-labor__doc-meta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                          <path d="M14 4v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                        </svg>
                        pdf
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      class="page-labor__doc-card"
                      href="images/documents/recomendation_2026.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span class="page-labor__doc-title">Рекомендуемые мероприятия по улучшению условий труда</span>
                      <span class="page-labor__doc-meta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                          <path d="M14 4v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                        </svg>
                        pdf
                      </span>
                    </a>
                  </li>
                </ul>
                  </div>
                </div>
              </details>

              <details class="page-labor__group">
                <summary class="page-labor__group-toggle">2024</summary>
                <div class="page-labor__group-body">
                  <div class="page-labor__group-inner">
                    <ul class="page-labor__cards">
                  <li>
                    <a
                      class="page-labor__doc-card"
                      href="images/documents/COUT_2024.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span class="page-labor__doc-title">Сводная ведомость оценки условий труда</span>
                      <span class="page-labor__doc-meta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                          <path d="M14 4v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                        </svg>
                        pdf
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      class="page-labor__doc-card"
                      href="images/documents/recomendation_2024.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span class="page-labor__doc-title">Рекомендуемые мероприятия по улучшению условий труда</span>
                      <span class="page-labor__doc-meta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                          <path d="M14 4v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                        </svg>
                        pdf
                      </span>
                    </a>
                  </li>
                </ul>
                  </div>
                </div>
              </details>
            </div>
          </article>
        </div>
      </section>
    </main>
'''

html = f'''<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Сводные ведомости оценки условий труда — DC Engineering</title>
    <meta
      name="description"
      content="Сводные ведомости и рекомендуемые мероприятия по результатам специальной оценки условий труда DC Engineering."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&family=Onest:wght@300;400;500;600&family=Oswald:wght@600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="styles.css?v=20260715-labor-page" />
    <link rel="stylesheet" href="labor-conditions.css?v=20260715-labor-accordion-smooth" />
    <script defer src="theme.js"></script>
  </head>
  <body class="page-labor">
    <a class="skip-link" href="#main">К основному содержимому</a>

{header}

{main}

{footer}

    <script defer src="subpage-hero.js"></script>
    <script defer src="feature-reveal.js"></script>
    <script defer src="labor-accordion.js?v=20260715-labor-accordion"></script>
    <script defer src="nav.js?v=20260710-subnav-header-lock"></script>
  </body>
</html>
'''

(ROOT / "labor-conditions.html").write_text(html, encoding="utf-8", newline="\n")
print("Created labor-conditions.html")
