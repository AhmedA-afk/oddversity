#!/usr/bin/env node
/**
 * Verify every internal link in the built site resolves to a real file.
 *
 *   node scripts/check-links.mjs
 *
 * Exits non-zero on the first dead target, so it can gate a deploy. Runs over
 * dist/, which means it catches links that only exist after rendering — the
 * ones a source-level check misses.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

if (!statSync(DIST, { throwIfNoEntry: false })) {
  console.error(`${DIST}/ not found — run "npm run build" first.`);
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
})(DIST);

const routes = new Set();
for (const file of files) {
  const rel = file.slice(DIST.length + 1);
  if (rel === 'index.html') routes.add('/');
  else if (rel.endsWith('/index.html')) routes.add(rel.slice(0, -11));
  routes.add(rel);
}

const dead = new Map();
const pages = files.filter((f) => f.endsWith('.html'));

for (const file of pages) {
  const from = file.slice(DIST.length + 1).replace(/\/index\.html$/, '') || '/';
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    const target = match[1].replace(/\/$/, '') || '/';
    if (routes.has(target) || routes.has(target.slice(1))) continue;
    if (!dead.has(target)) dead.set(target, new Set());
    dead.get(target).add(from);
  }
}

console.log(`${pages.length} pages checked, ${routes.size} routes known.`);

if (dead.size === 0) {
  console.log('No dead internal links.');
  process.exit(0);
}

console.error(`\n${dead.size} dead internal link target(s):\n`);
for (const [target, sources] of dead) {
  const list = [...sources];
  console.error(`  ${target}`);
  console.error(`    from ${list.slice(0, 3).join(', ')}${list.length > 3 ? ` (+${list.length - 3} more)` : ''}`);
}
process.exit(1);
