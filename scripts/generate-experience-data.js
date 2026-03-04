#!/usr/bin/env node
/**
 * Generates experience recap data from vibecoding folders (sibling of zdeadex.com).
 * Run from repo root: node scripts/generate-experience-data.js
 * Output: data/junction.json, data/philidor.json, data/stakelab.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const VIBECODING = path.join(ROOT, '..');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function findPackageJson(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      const pkgPath = path.join(full, 'package.json');
      if (fs.existsSync(pkgPath)) list.push(pkgPath);
      findPackageJson(full, list);
    }
  }
  return list;
}

function extractDeps(pkg) {
  const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
  const dev = pkg.devDependencies ? Object.keys(pkg.devDependencies) : [];
  return { deps, dev };
}

function inferLanguages(pkgPaths, pkgContents) {
  const lang = new Set();
  pkgContents.forEach((pkg) => {
    if (pkg && (pkg.devDependencies?.typescript || pkg.dependencies?.typescript)) lang.add('TypeScript');
    if (pkg && pkg.dependencies?.react) lang.add('React');
  });
  pkgPaths.forEach((p) => {
    const dir = path.dirname(p);
    if (fs.existsSync(path.join(dir, 'tsconfig.json'))) lang.add('TypeScript');
    if (fs.existsSync(path.join(dir, 'vite.config.ts')) || fs.existsSync(path.join(dir, 'vite.config.js'))) lang.add('Vite');
  });
  if (lang.size === 0) lang.add('JavaScript');
  return Array.from(lang);
}

function getReadmeSnippet(dir, maxLines = 15) {
  for (const name of ['README.md', 'Readme.md']) {
    const fp = path.join(dir, name);
    if (fs.existsSync(fp)) {
      const text = fs.readFileSync(fp, 'utf8');
      return text.split('\n').slice(0, maxLines).join('\n').trim();
    }
  }
  return '';
}

// ——— Junction ———
function buildJunction() {
  const base = path.join(VIBECODING, 'junction');
  const junctionCode = path.join(base, 'JunctionCode');
  const perpsApi = path.join(base, 'perps-api');
  const pkgPaths = [];
  if (fs.existsSync(junctionCode)) pkgPaths.push(...findPackageJson(junctionCode, []));
  if (fs.existsSync(perpsApi)) pkgPaths.push(path.join(perpsApi, 'package.json'));
  const allPkgs = pkgPaths.map((p) => readJson(p)).filter(Boolean);
  return {
    name: 'Junction',
    role: 'DeFi / Exchanges',
    url: 'https://junction.exchange',
    description: 'DeFi exchange platform: swap, bridge, perps API, referral system.',
    languages: ['TypeScript', 'JavaScript', 'React', 'Vite', 'Node.js'],
    implementations: [
      'Perps API (Express + TypeScript)',
      'Front-end (JunctionCode: gateway, junction-front-end)',
      'Assets, balances, fees, routing, chains registry, CoinGecko proxy',
      'Referral & invite system',
    ],
    thirdParty: ['Express', 'Viem', 'CoinGecko', 'Hyperliquid', 'OpenOcean', 'CCTP'],
    repos: ['JunctionCode (multi-service)', 'perps-api'],
  };
}

// ——— Philidor ———
function buildPhilidor() {
  const base = path.join(VIBECODING, 'philidor-io');
  const pkgPaths = findPackageJson(base, []);
  const rootPkg = readJson(path.join(base, 'package.json'));
  const apps = rootPkg?.scripts ? Object.keys(rootPkg.scripts).filter((s) => s.startsWith('dev:') || s.startsWith('build:')).map((s) => s.replace(/^(dev|build):/, '')) : [];
  const uniqApps = [...new Set(apps)];
  return {
    name: 'Philidor',
    role: 'Institutional DeFi',
    url: 'https://philidor.io',
    description: 'Institutional-grade DeFi vault risk assessment and curation platform.',
    languages: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Hono'],
    implementations: [
      'Monorepo (Turbo): landing, app, analytics, API, MCP, indexer',
      'REST API (Hono) — single backend for all clients',
      'On-chain indexer (sync, events, risk scores)',
      'MCP server for AI agents (vault search, risk breakdown)',
      'PostgreSQL (TimescaleDB), Redis (rate limit + cache)',
      'Vercel (frontends + MCP), VPS (API + indexer)',
    ],
    thirdParty: ['Vercel', 'PostgreSQL / TimescaleDB', 'Redis', 'Viem', 'Enso', 'Resend', 'OpenAPI/Swagger'],
    repos: ['philidor-io (monorepo)'],
  };
}

// ——— Stakelab ———
function buildStakelab() {
  const base = path.join(VIBECODING, 'Website-StakeLab');
  const pkg = readJson(path.join(base, 'package.json'));
  const deps = pkg ? { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) } : {};
  const keys = Object.keys(deps);
  const services = [];
  if (keys.some((k) => k.includes('cosmos') || k.includes('cosmjs'))) services.push('Cosmos / chain-registry');
  if (keys.some((k) => k.includes('starknet'))) services.push('Starknet');
  if (keys.some((k) => k.includes('viem') || k.includes('wagmi'))) services.push('EVM (Viem / Wagmi)');
  if (keys.some((k) => k.includes('redux') || k.includes('react-query'))) services.push('State (Redux, React Query)');
  return {
    name: 'Stakelab',
    role: 'Infrastructure',
    url: 'https://stakelab.zone',
    description: 'Staking platform: frontend (React + Vite) and backend (AdonisJS), multi-chain.',
    languages: ['TypeScript', 'React', 'Vite', 'Node.js', 'AdonisJS'],
    implementations: [
      'Monorepo: frontend (Vite + React) + backend (AdonisJS)',
      'WebSocket + REST API',
      'Multi-chain: Cosmos (CosmJS, Cosmos Kit), Starknet, EVM (Wagmi/Viem)',
      'Lido staking vault CLI',
      'CoinGecko proxy for prices',
    ],
    thirdParty: ['AdonisJS', 'MySQL', 'Redis', 'CosmJS', 'Starknet.js', 'Viem', 'Wagmi', 'CoinGecko', 'Socket.io'],
    repos: ['Website-StakeLab', 'stakelab (assets/docs)'],
  };
}

// ——— Write data & HTML ———
function writeJson(name, data) {
  const outDir = path.join(ROOT, 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(data, null, 2));
  console.log(`Wrote data/${name}.json`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildExperiencePage(slug, data, backHref) {
  const impl = (data.implementations || []).map((i) => `    <li>${escapeHtml(i)}</li>`).join('\n');
  const third = (data.thirdParty || []).map((t) => `<span class="recap-pill">${escapeHtml(t)}</span>`).join('\n');
  const lang = (data.languages || []).map((l) => `<span class="recap-pill">${escapeHtml(l)}</span>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(data.name)} — Experience</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${backHref}styles.css" />
  <link rel="stylesheet" href="${backHref}experience.css" />
</head>
<body>
  <div class="noise" aria-hidden="true"></div>
  <div class="glow" aria-hidden="true"></div>
  <main class="experience-page">
    <a href="${backHref}index.html" class="experience-back">← Back to portfolio</a>
    <header class="experience-header">
      <h1 class="experience-title">${escapeHtml(data.name)}</h1>
      <p class="experience-role">${escapeHtml(data.role)}</p>
      <a href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer" class="experience-link">${escapeHtml(data.url)}</a>
    </header>
    <p class="experience-desc">${escapeHtml(data.description)}</p>
    <section class="recap-section">
      <h2>What was implemented</h2>
      <ul class="recap-list">
${impl}
      </ul>
    </section>
    <section class="recap-section">
      <h2>Languages & frameworks</h2>
      <div class="recap-pills">${lang}</div>
    </section>
    <section class="recap-section">
      <h2>Third-party services & APIs</h2>
      <div class="recap-pills">${third}</div>
    </section>
    ${data.repos ? `<section class="recap-section"><h2>Repos / folders (vibecoding)</h2><p class="recap-repos">${escapeHtml(data.repos.join(', '))}</p></section>` : ''}
  </main>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(VIBECODING)) {
    console.warn('Vibecoding folder not found at', VIBECODING, '- using built-in recap data.');
  }
  const junction = buildJunction();
  const philidor = buildPhilidor();
  const stakelab = buildStakelab();

  writeJson('junction', junction);
  writeJson('philidor', philidor);
  writeJson('stakelab', stakelab);

  const expDir = path.join(ROOT, 'experience');
  if (!fs.existsSync(expDir)) fs.mkdirSync(expDir, { recursive: true });
  const back = '../';
  fs.writeFileSync(path.join(expDir, 'junction.html'), buildExperiencePage('junction', junction, back));
  fs.writeFileSync(path.join(expDir, 'philidor.html'), buildExperiencePage('philidor', philidor, back));
  fs.writeFileSync(path.join(expDir, 'stakelab.html'), buildExperiencePage('stakelab', stakelab, back));
  console.log('Wrote experience/junction.html, experience/philidor.html, experience/stakelab.html');
}

main();
