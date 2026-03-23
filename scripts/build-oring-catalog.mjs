/**
 * Hämtar Guideline öringflugor (alla listningssidor) via Jina Reader-proxy
 * och skriver data/troutFlies.json.
 *
 * Kör: node scripts/build-oring-catalog.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'data', 'troutFlies.json');
const SUPPLEMENT = join(__dirname, '..', 'data', 'catalog-supplement.json');

const PAGES = 6;
const LIST_URL = (p) =>
  `https://r.jina.ai/https://www.guidelineflyfish.com/se/utrustning/flugor/oringflugor?page=${p}`;

const SKIP_SLUGS = new Set([
  'utrustning',
  'flugor',
  'oringflugor',
  'kundservice',
  'spodelar',
  'sok',
  'journal',
  'outlet',
  'gearguide',
  'tillbehor',
  'vadare-klader',
  'vadarpaket',
  'vatten-tekniker',
  'kladkoncept',
  'forvaring---barsystem',
  'sposerier',
  'embrace',
  'experience-waterproof',
]);

function extractHookSize(slug, name) {
  const fromSlug = slug.match(/-(\d{1,2})$/);
  if (fromSlug) return fromSlug[1];
  const hash = name.match(/#(\d{1,2})\b/);
  if (hash) return hash[1];
  return null;
}

function extractNameNearSlug(markdown, slug, urlIndex) {
  const esc = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const les = new RegExp(
    `\\[Läs mer\\]\\(https://www\\.guidelineflyfish\\.com/se/${esc}\\)\\s+([^\\n]+)`,
  );
  const lm = markdown.match(les);
  if (lm) return lm[1].trim();

  const before = markdown.slice(Math.max(0, urlIndex - 1200), urlIndex);
  const imgs = before.match(/Image\s+\d+:\s*([^\]]+)\]/g);
  if (imgs?.length) {
    const last = imgs[imgs.length - 1].match(/Image\s+\d+:\s*([^\]]+)\]/);
    if (last) return last[1].trim();
  }
  return slug;
}

function parseProducts(markdown) {
  const bySlug = new Map();

  const lesRe =
    /\[Läs mer\]\(https:\/\/www\.guidelineflyfish\.com\/se\/([^)]+)\)\s+([^\n]+)/g;
  let m;
  while ((m = lesRe.exec(markdown))) {
    const slug = m[1];
    if (SKIP_SLUGS.has(slug)) continue;
    bySlug.set(slug, m[2].trim());
  }

  const urlRe = /https:\/\/www\.guidelineflyfish\.com\/se\/([a-z0-9\-]+)/g;
  while ((m = urlRe.exec(markdown))) {
    const slug = m[1];
    if (SKIP_SLUGS.has(slug) || bySlug.has(slug)) continue;

    const i = m.index;
    const window = markdown.slice(i, i + 400);
    if (!/\d+\.\d+\s*SEK/.test(window) && !/~~\d+\.\d+\s*SEK/.test(window)) {
      continue;
    }

    const name = extractNameNearSlug(markdown, slug, i);
    bySlug.set(slug, name);
  }

  return [...bySlug.entries()].map(([catalogId, name]) => ({
    catalogId,
    name,
    hookSize: extractHookSize(catalogId, name),
    flyType: null,
    hatch: null,
  }));
}

async function fetchText(url) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: 'text/plain' },
    });
    if (res.status === 429) {
      await sleep(2500 * attempt);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }
  throw new Error(`Too many retries for ${url}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const all = [];
  for (let p = 1; p <= PAGES; p++) {
    const url = LIST_URL(p);
    process.stderr.write(`Fetching page ${p}/${PAGES}…\n`);
    const md = await fetchText(url);
    const chunk = parseProducts(md);
    process.stderr.write(`  → ${chunk.length} products\n`);
    all.push(...chunk);
    if (p < PAGES) await sleep(2000);
  }
  const map = new Map();
  for (const it of all) {
    if (!map.has(it.catalogId)) map.set(it.catalogId, it);
  }

  try {
    const extra = JSON.parse(readFileSync(SUPPLEMENT, 'utf8'));
    for (const it of extra) {
      if (!map.has(it.catalogId)) map.set(it.catalogId, it);
    }
    process.stderr.write(`Merged ${extra.length} supplement rows (Jina drops some discount rows).\n`);
  } catch {
    process.stderr.write('No catalog-supplement.json merge.\n');
  }

  const merged = [...map.values()];
  merged.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  writeFileSync(OUT, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  process.stderr.write(`\nWrote ${merged.length} unique flies to ${OUT}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
