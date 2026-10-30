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
const ASSET_V = '5';

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
  <link rel="stylesheet" href="${prefix}styles.css?v=${ASSET_V}" />
  ${detail ? `<link rel="stylesheet" href="${prefix}experience.css?v=${ASSET_V}" />\n  ` : ''}<script>document.documentElement.classList.add('js')</script>
</head>`;
}

function atmosphere() {
  return `<div class="noise" aria-hidden="true"></div>
  <div class="glow" aria-hidden="true"></div>`;
}

function nav(showHomeLink) {
  const skip = `<a class="skip" href="#content">Skip to content</a>`;
  if (!showHomeLink) return skip;
  return `${skip}
  <p class="home-link"><a href="index.html">zdeadex.com</a></p>`;
}

function logo(item, prefix) {
  if (!item.logo) {
    return `<span class="logo-tile logo-tile--empty">${escapeHtml(item.initials)}</span>`;
  }
  return `<span class="logo-tile"><img class="logo" src="${prefix}${escapeHtml(item.logo)}" alt="" /></span>`;
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

  const links = item.links && item.links.length
    ? item.links
    : [{ href: item.url, label: item.urlLabel || item.url }];
  const linkHtml = links.map((link) => `          <a class="ext" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} <span class="ext__arrow" aria-hidden="true">↗</span></a>`).join('\n');

  return `${head(`${item.name}: Adrien Faguet`, item.pitch, prefix, true)}
<body>
  ${atmosphere()}
  ${nav(false)}
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
${linkHtml}
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
  <script src="${prefix}script.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}

function filterTokens(item) {
  const tokens = new Set();
  if (item.statusKind) tokens.add(item.statusKind);
  if (item.projectGroup === 'side') tokens.add('side');
  if (item.experienceOrder != null) tokens.add('experience');
  if (item.statusKind === 'preview') tokens.add('building');
  if (item.kind === 'investment') tokens.add('investment');
  return [...tokens].join(' ');
}

function tagLabel(item) {
  if (item.kind === 'investment') return 'Investment';
  if (item.projectGroup === 'side') return 'Side project';
  if (item.experienceOrder != null) return 'Experience';
  return '';
}

function media(item) {
  const shot = (item.shots || [])[0];
  const mark = logo(item, '');
  if (!shot) {
    return `<span class="vcard__media vcard__media--mark">${mark}</span>`;
  }
  const src = `assets/projects/${item.slug}/${shot.file}`;
  return `<span class="vcard__media"><img src="${escapeHtml(src)}" alt="" /><span class="vcard__logo">${mark}</span></span>`;
}

function markCard(item) {
  const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `        <li>
          <a class="mark" href="${escapeHtml(item.href)}"${external}>
            ${logo(item, '')}
            <span class="mark__body">
              <span class="mark__top">
                <span class="mark__name">${escapeHtml(item.name)}</span>
                ${item.status ? badge(item) : ''}
              </span>
              <span class="mark__note">${escapeHtml(item.card)}</span>
            </span>
          </a>
        </li>`;
}

function showcaseCard(item) {
  const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const role = item.experienceNote && item.experienceNote !== item.card
    ? `<span class="vcard__role">${escapeHtml(item.experienceNote)}</span>`
    : '';
  const tag = tagLabel(item);
  return `        <li>
          <a class="vcard" href="${escapeHtml(item.href || hrefFor(item))}" data-filters="${escapeHtml(filterTokens(item))}"${external}>
            ${media(item)}
            <span class="vcard__body">
              <span class="vcard__top">
                <span class="vcard__name">${escapeHtml(item.name)}</span>
                ${badge(item)}
              </span>
              <span class="vcard__note">${escapeHtml(item.card)}</span>
              ${!item.external && item.urlLabel ? `<span class="vcard__url">${escapeHtml(item.urlLabel)}</span>` : ''}
              ${role}
              ${tag ? `<span class="vcard__tags"><span class="tag">${escapeHtml(tag)}</span></span>` : ''}
            </span>
          </a>
        </li>`;
}

function homePage() {
  const order = ['philidor', 'junction', 'stakelab', 'mypump', 'paygram', 'gymmy', 'struvo', 'ctrl', 'ledger', 'league-of-legends'];
  const bySlug = new Map(projects.map((item) => [item.slug, item]));
  const showcase = order.map((slug) => bySlug.get(slug)).filter(Boolean);
  const investments = [
    { name: 'Travala', initials: 'T', logo: 'assets/logos/travala.png', href: 'https://www.travala.com', card: 'Investment', status: 'Investment', statusKind: 'investment', external: true },
    { name: 'Delicity', initials: 'D', logo: 'assets/logos/delicity.png', href: 'https://delicity.com', card: 'Investment', status: 'Investment', statusKind: 'investment', external: true },
    { name: 'Frachtis', initials: 'F', logo: 'assets/logos/frachtis.png', href: 'https://frachtis.com', card: 'Investment', status: 'Investment', statusKind: 'investment', external: true },
    { name: '50 Partners', initials: '50', logo: 'assets/logos/50partners.png', href: 'https://www.50partners.fr', card: 'Investment', status: 'Investment', statusKind: 'investment', external: true },
    { name: 'Rain.fi', initials: 'R', logo: 'assets/logos/rain.png', href: 'https://rain.fi', card: 'Investment (acq)', status: 'Acq', statusKind: 'investment', external: true },
    { name: 'Skip', initials: 'Sk', logo: 'assets/logos/skip.png', href: 'https://skip.go', card: 'Investment (acq)', status: 'Acq', statusKind: 'investment', external: true },
  ];
  const holdings = [
    { name: 'Hyperliquid', initials: 'HYPE', logo: 'assets/logos/hype.png', href: 'https://hyperliquid.xyz', card: 'HYPE', external: true },
    { name: 'pump.fun', initials: 'PUMP', logo: 'assets/logos/pump.png', href: 'https://pump.fun', card: 'PUMP', external: true },
    { name: 'Ethena', initials: 'ENA', logo: 'assets/logos/ena.svg', href: 'https://ethena.fi', card: 'ENA', external: true },
    { name: 'Aave', initials: 'AAVE', logo: 'assets/logos/aave.svg', href: 'https://aave.com', card: 'AAVE', external: true },
    { name: 'Ondo', initials: 'ONDO', logo: 'assets/logos/ondo.svg', href: 'https://ondo.finance', card: 'ONDO', external: true },
  ];

  return `${head('Adrien Faguet: Zdeadex', 'Adrien Faguet (Zdeadex). Operation, Product, Engineering, AI.', '', false)}
<body>
  ${atmosphere()}
  ${nav(true)}
  <main id="content">
    <div class="wrap">
      <section class="hero" id="top">
        <div class="photo-container reveal">
          <img class="photo" src="me.jpg?v=${ASSET_V}" alt="Adrien Faguet" width="200" height="200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <span class="photo-fallback">AF</span>
        </div>
        <div class="reveal">
          <h1>Adrien Faguet</h1>
          <p class="hero__handle">Zdeadex</p>
          <p class="hero__tagline">Operation, Product, Engineering, AI</p>
        </div>
        <div class="prose reveal">
          <p class="lead">Hi, I'm Adrien, better known as <strong>Zdeadex</strong>, a retired professional League of Legends player with a background in Engineering and Economics.</p>
          <p>I've spent the last few years building products and leading teams to production-ready infrastructure in the crypto ecosystem (staking, DeFi, exchanges).</p>
          <p>Experienced in scaling startups from 1 to 900+ people, fostering growth and engineering excellence.</p>
        </div>
      </section>

      <section class="work" id="work" aria-labelledby="work-title">
        <h2 id="work-title" class="work__label">Work</h2>
        <div class="filters" role="toolbar" aria-label="Filter projects">
          <button type="button" class="chip is-on" data-filter="all" aria-pressed="true">All</button>
          <button type="button" class="chip" data-filter="live" aria-pressed="false">Live</button>
          <button type="button" class="chip" data-filter="building" aria-pressed="false">Building</button>
          <button type="button" class="chip" data-filter="left" aria-pressed="false">Left</button>
          <button type="button" class="chip" data-filter="retired" aria-pressed="false">Retired</button>
          <button type="button" class="chip" data-filter="side" aria-pressed="false">Side projects</button>
          <button type="button" class="chip" data-filter="experience" aria-pressed="false">Experience</button>
          <span class="filters__count" aria-live="polite">${showcase.length} projects</span>
        </div>
        <ul class="showcase">
${showcase.map(showcaseCard).join('\n')}
        </ul>
      </section>

      <section class="band" id="investments" aria-labelledby="investments-title">
        <h2 id="investments-title" class="work__label">Investments</h2>
        <ul class="marks">
${investments.map(markCard).join('\n')}
        </ul>
      </section>

      <section class="band" id="holdings" aria-labelledby="holdings-title">
        <h2 id="holdings-title" class="work__label">Holdings</h2>
        <ul class="marks">
${holdings.map(markCard).join('\n')}
        </ul>
      </section>
    </div>
  </main>
  <footer class="site-footer">
    <div class="wrap">
      <span>Adrien Faguet · Zdeadex</span>
      <a href="#top">Back to top</a>
    </div>
  </footer>
  <script src="script.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}

function write(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('Wrote', path.relative(ROOT, file));
}

function redirectPage(target) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirect</title>
  <meta http-equiv="refresh" content="0; url=${target}" />
  <link rel="canonical" href="${target}" />
  <script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>
  <p><a href="${target}">Home</a></p>
</body>
</html>
`;
}

write(path.join(ROOT, 'index.html'), homePage());
for (const item of projects) {
  write(path.join(ROOT, item.dir, `${item.slug}.html`), projectPage(item));
}
write(path.join(ROOT, 'projects', 'winnie.html'), redirectPage('../index.html'));
write(path.join(ROOT, 'projects', 'winnieswap.html'), redirectPage('../index.html'));
