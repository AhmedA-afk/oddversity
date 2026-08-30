#!/usr/bin/env node
/**
 * Mechanically enforce the diagram grammar from docs/visual-system.md.
 *
 *   node scripts/check-diagrams.mjs
 *
 * Agent review catches meaning — whether a figure overclaims, whether brass is
 * used for something that actually breaks. This catches the things a reviewer
 * skims past: a hardcoded hex that silently breaks one theme, a missing
 * viewBox, a caption that was never written. Both together, neither alone.
 *
 * Exits non-zero on any violation so it can gate a build.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/components/diagrams';
const SHARED = new Set(['Figure.astro']);

const ALLOWED_CLASSES = new Set([
  'dg-box', 'dg-box-warn', 'dg-box-mute',
  'dg-line', 'dg-line-warn', 'dg-rule',
  'dg-label', 'dg-label-warn',
  'dg-note', 'dg-note-warn',
  'dg-arrow', 'dg-arrow-warn',
]);

const MAX_ELEMENTS = 7;

const files = readdirSync(DIR).filter((f) => f.endsWith('.astro') && !SHARED.has(f));
const problems = [];
const report = [];

for (const file of files) {
  const path = join(DIR, file);
  const src = readFileSync(path, 'utf8');
  const fail = (msg) => problems.push(`${file}: ${msg}`);

  // A hardcoded colour is invisible in review and wrong in one of the two
  // themes. This is the single most valuable check here.
  const hex = src.match(/(?:fill|stroke|color)\s*[:=]\s*["']?#[0-9a-fA-F]{3,8}/g);
  if (hex) fail(`hardcoded colour — ${[...new Set(hex)].join(', ')}. Use a dg-* class.`);

  // Every dg-* class used must be one the primitives actually define.
  const used = new Set();
  for (const m of src.matchAll(/\bdg-[a-z-]+/g)) used.add(m[0]);
  for (const cls of used) {
    if (!ALLOWED_CLASSES.has(cls)) fail(`unknown primitive class "${cls}"`);
  }

  if (!/viewBox=/.test(src)) fail('svg has no viewBox — it cannot scale to the prose column');
  if (/<svg[^>]*\swidth=["']\d/.test(src)) fail('svg sets a fixed pixel width — use viewBox only');
  if (!/<Figure\b/.test(src)) fail('does not use the Figure wrapper, so it has no caption or accessible name');
  if (!/caption=/.test(src)) fail('no caption');
  if (!/title=/.test(src)) fail('no accessible title');

  // Primary shapes: rects and circles carrying a box class. Lines, arrows,
  // markers and text are not primary elements.
  const boxes = (src.match(/class="dg-box(?:-warn|-mute)?"/g) || []).length
    + (src.match(/class:list=\{\[\s*'dg-box/g) || []).length;
  // A component may render shapes from an array, which the regex undercounts.
  const looped = /\.map\(/.test(src);
  if (!looped && boxes > MAX_ELEMENTS) {
    fail(`${boxes} primary shapes, limit is ${MAX_ELEMENTS} — this is two diagrams`);
  }

  // Brass must mean something. If a figure uses no warn class at all that is
  // fine; if it uses one it should be for a single element, not scattered.
  const warn = (src.match(/dg-(?:box|line|label|note|arrow)-warn/g) || []).length;

  report.push({ file, boxes: looped ? `${boxes}+ (looped)` : boxes, warn });
}

console.log(`${files.length} diagram components checked\n`);
for (const r of report) {
  console.log(`  ${r.file.padEnd(34)} shapes:${String(r.boxes).padStart(3)}  brass refs:${String(r.warn).padStart(2)}`);
}

if (!problems.length) {
  console.log('\nNo grammar violations.');
  process.exit(0);
}

console.error(`\n${problems.length} violation(s):\n`);
for (const p of problems) console.error(`  ${p}`);
process.exit(1);
