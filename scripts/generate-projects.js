#!/usr/bin/env node
/**
 * Renders the home page and one static page per project from data/projects.json.
 * Run from the repo root: node scripts/generate-projects.js
 *
 * Add a project by appending an object to data/projects.json, putting screenshots
 * in assets/projects/<slug>/, then re-running this script.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects.json'), 'utf8'));

const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif&display=swap';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function todo(message) {
  return `<div class="callout"><p class="callout__label">TODO</p><p>${escapeHtml(message)}</p></div>`;
}

const WHY_TODO = 'Why I built it is not stated in this portfolio or on the product site. Replace this note with the problem and the motivation.';
const ROLE_TODO = 'A personal role is not stated in this portfolio or on the product site.';
const STACK_TODO = 'Languages and frameworks are not stated in this portfolio or on the product site.';

function head(title, description, prefix, detail) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(description)}" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${FONTS}" rel="stylesheet" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231a1a18'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='Georgia,serif' font-size='16' fill='%23f3f2ee'%3EA%3C/text%3E%3C/svg%3E" />
  <link rel="stylesheet" href="${prefix}styles.css" />
  ${detail ? `<link rel="stylesheet" href="${prefix}experience.css" />\n  ` : ''}<script>document.documentElement.classList.add('js')</script>
</head>`;
}

function nav(prefix, homeHref) {
  return `<a class="skip" href="#content">Skip to content</a>
  <header class="nav">
    <div class="nav__inner">
      <a class="nav__brand" href="${homeHref}">Adrien Faguet</a>
      <nav class="nav__links" aria-label="Sections">
        <a href="${prefix}index.html#experience">Experience</a>
        <a href="${prefix}index.html#projects">Projects</a>
        <a href="${prefix}index.html#investing">Investing</a>
      </nav>
    </div>
  </header>`;
}

function logo(item, prefix) {
  if (!item.logo) {
    return `<span class="logo-fallback" style="display:flex">${escapeHtml(item.initials)}</span>`;
  }
  return `<img class="logo" src="${prefix}${escapeHtml(item.logo)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <span class="logo-fallback">${escapeHtml(item.initials)}</span>`;
}

function badge(item) {
  return `<span class="badge badge--${escapeHtml(item.statusKind)}">${escapeHtml(item.status)}</span>`;
}

function hrefFor(item) {
  return `${item.dir}/${item.slug}.html`;
}

function bullets(items) {
  return `<ul>\n${items.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}\n          </ul>`;
}

function pills(items) {
  return `<div class="pills pills--stack">\n${items.map((item) => `            <span class="pill pill--static">${escapeHtml(item)}</span>`).join('\n')}\n          </div>`;
}

function shots(item, prefix) {
  if (!item.shots || item.shots.length === 0) {
    const reason = item.shotPlaceholder || 'No reachable public URL for this project.';
    return `<figure class="shot">
          <div class="shot__placeholder">
            <div>
              <strong>Screenshot unavailable</strong>
              <p>${escapeHtml(reason)}</p>
            </div>
          </div>
        </figure>`;
  }
  return item.shots.map((shot, index) => {
    const src = `${prefix}assets/projects/${item.slug}/${shot.file}`;
    return `<figure class="shot">
          <a href="${escapeHtml(src)}">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(shot.alt)}" width="1440" height="900" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" />
          </a>
          <figcaption>${escapeHtml(shot.caption)}</figcaption>
        </figure>`;
  }).join('\n        ');
}

function projectPage(item) {
  const prefix = '../';
  const paragraphs = (item.paragraphs || []).map((p) => `          <p>${escapeHtml(p)}</p>`).join('\n');
  const why = item.why
    ? `<p>${escapeHtml(item.why)}</p>`
    : todo(item.whyTodo || WHY_TODO);
  const role = item.role
    ? `<p>${escapeHtml(item.role)}</p>`
    : todo(item.roleTodoDetail ? `${ROLE_TODO} ${item.roleTodoDetail}` : ROLE_TODO);

  const sections = [
    `<section class="block reveal">
        <h2>Why I built it</h2>
        ${why}
      </section>`,
    `<section class="block reveal">
        <h2>Role</h2>
        ${role}
      </section>`,
    paragraphs
      ? `<section class="block reveal">
        <h2>What it does</h2>
${paragraphs}
      </section>`
      : '',
    item.features && item.features.length
      ? `<section class="block reveal">
        <h2>Key features</h2>
        ${bullets(item.features)}
      </section>`
      : (item.featuresTodo ? `<section class="block reveal"><h2>Key features</h2>${todo(item.featuresTodo)}</section>` : ''),
    item.implemented && item.implemented.length
      ? `<section class="block reveal">
        <h2>What was implemented</h2>
        ${bullets(item.implemented)}
      </section>`
      : '',
    item.stack && item.stack.length
      ? `<section class="block reveal">
        <h2>Stack</h2>
        ${pills(item.stack)}
      </section>`
      : (item.stackTodo ? `<section class="block reveal"><h2>Stack</h2>${todo(STACK_TODO)}</section>` : ''),
    item.services && item.services.length
      ? `<section class="block reveal">
        <h2>Third-party services and APIs</h2>
        ${pills(item.services)}
      </section>`
      : '',
    `<section class="block reveal">
        <h2>Gallery</h2>
        <div class="gallery">
        ${shots(item, prefix)}
        </div>
      </section>`,
  ].filter(Boolean).join('\n\n      ');

  return `${head(`${item.name} — Adrien Faguet`, item.pitch, prefix, true)}
<body>
  ${nav(prefix, `${prefix}index.html`)}
  <main id="content" class="case-wrap">
    <div class="wrap">
      <a class="back" href="${prefix}index.html"><span class="back__arrow" aria-hidden="true">←</span> Portfolio</a>
      <header class="case">
        <div class="case__id">
          ${logo(item, prefix)}
          <h1>${escapeHtml(item.name)}</h1>
        </div>
        <p class="case__pitch">${escapeHtml(item.pitch)}</p>
        <div class="case__meta">
          ${badge(item)}
          <a class="ext" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.urlLabel)} <span class="ext__arrow" aria-hidden="true">↗</span></a>
        </div>
      </header>
      <div class="blocks">
      ${sections}
      </div>
    </div>
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <span>Adrien Faguet · Zdeadex</span>
      <a href="${prefix}index.html">Portfolio</a>
    </div>
  </footer>
  <script src="${prefix}script.js"></script>
</body>
</html>
`;
}

function homePage() {
  const experience = projects
    .filter((p) => p.experienceOrder != null)
    .sort((a, b) => a.experienceOrder - b.experienceOrder);
  const side = projects.filter((p) => p.projectGroup === 'side').sort((a, b) => a.projectOrder - b.projectOrder);
  const more = projects.filter((p) => p.projectGroup === 'more').sort((a, b) => a.projectOrder - b.projectOrder);

  const row = (item) => `        <li class="reveal">
          <a class="row" href="${hrefFor(item)}">
            ${logo(item, '')}
            <span class="row__body">
              <span class="row__top">
                <span class="row__name">${escapeHtml(item.name)}</span>
                ${badge(item)}
              </span>
              <span class="row__note">${escapeHtml(item.experienceNote)}</span>
            </span>
          </a>
        </li>`;

  const card = (item) => `        <li class="reveal">
          <a class="card" href="${hrefFor(item)}">
            <span class="card__top">
              <span class="card__name">${escapeHtml(item.name)}</span>
              ${badge(item)}
            </span>
            <span class="card__note">${escapeHtml(item.card)}</span>
          </a>
        </li>`;

  const grid = (items) => `<ul class="grid">\n${items.map(card).join('\n')}\n      </ul>`;

  return `${head('Adrien Faguet — Zdeadex', 'Adrien Faguet (Zdeadex). Operation, Product, Engineering, AI.', '', false)}
<body>
  ${nav('', '#top')}
  <main id="content">
    <div class="wrap">
      <section class="hero" id="top">
        <div class="hero__id reveal">
          <img class="hero__photo" src="me.jpg" alt="Adrien Faguet" width="84" height="84" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <span class="photo-fallback">AF</span>
          <div>
            <p class="eyebrow">Zdeadex</p>
            <h1>Adrien Faguet</h1>
            <p class="hero__tagline">Operation, Product, Engineering, AI</p>
          </div>
        </div>
        <div class="prose reveal">
          <p class="lead">Hi, I'm Adrien, better known as <strong>Zdeadex</strong>—a retired professional League of Legends player with a background in Engineering and Economics.</p>
          <p>I've spent the last few years building products and leading teams to production-ready infrastructure in the crypto ecosystem (staking, DeFi, exchanges).</p>
          <p>Experienced in scaling startups from 1 to 900+ people, fostering growth and engineering excellence.</p>
        </div>
      </section>

      <section class="section" id="experience" aria-labelledby="experience-title">
        <div class="section__head reveal">
          <h2 id="experience-title">Experience</h2>
          <span class="section__count">${experience.length}</span>
        </div>
        <ul class="list">
${experience.map(row).join('\n')}
        </ul>
      </section>

      <section class="section" id="projects" aria-labelledby="projects-title">
        <div class="section__head reveal">
          <h2 id="projects-title">Projects</h2>
          <span class="section__count">${side.length + more.length}</span>
        </div>
        <h3 class="group-label">Side projects</h3>
        ${grid(side)}
        <h3 class="group-label">More projects</h3>
        ${grid(more)}
      </section>

      <section class="section" id="investing" aria-labelledby="investing-title">
        <div class="section__head reveal">
          <h2 id="investing-title">Investing</h2>
        </div>
        <p class="invest-lead reveal">Passionate about investing and helping teams grow from day one.</p>
        <div class="pills reveal">
          <a class="pill" href="https://www.ledger.com" target="_blank" rel="noopener noreferrer">Ledger</a>
          <a class="pill" href="https://www.travala.com" target="_blank" rel="noopener noreferrer">Travala</a>
          <a class="pill" href="https://delicity.com" target="_blank" rel="noopener noreferrer">Delicity</a>
          <a class="pill" href="https://frachtis.com" target="_blank" rel="noopener noreferrer">Frachtis</a>
          <a class="pill" href="https://www.50partners.fr" target="_blank" rel="noopener noreferrer">50 Partners</a>
          <a class="pill" href="https://rain.fi" target="_blank" rel="noopener noreferrer">Rain.fi <span class="acq">(acq)</span></a>
          <a class="pill" href="https://skip.go" target="_blank" rel="noopener noreferrer">Skip <span class="acq">(acq)</span></a>
        </div>
      </section>
    </div>
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <span>Adrien Faguet · Zdeadex</span>
      <a href="#top">Back to top</a>
    </div>
  </footer>
  <script src="script.js"></script>
</body>
</html>
`;
}

function write(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('Wrote', path.relative(ROOT, file));
}

write(path.join(ROOT, 'index.html'), homePage());
for (const item of projects) {
  write(path.join(ROOT, item.dir, `${item.slug}.html`), projectPage(item));
}
