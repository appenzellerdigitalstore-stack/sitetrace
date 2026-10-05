// scripts/bump-i18n-cache-buster.mjs
//
// One-shot: bump the cache-buster query string on every i18n.js and layout.js
// script tag so browsers re-fetch the fixed files. Idempotent.
//
// Replaces patterns like:
//   /js/i18n.js?v=25      →   /js/i18n.js?v=28
//   /js/layout.js?v=26    →   /js/layout.js?v=29

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { globSync } from 'node:fs';

const ROOT = 'F:\\.Projects\\sitetrace';
const NEW_I18N_VERSION = 32;
const NEW_LAYOUT_VERSION = 32;

const files = globSync('**/index.html', { cwd: ROOT })
  .map(f => resolve(ROOT, f))
  .filter(f => !f.includes('\\.tmp\\') && !f.includes('\\node_modules\\'));

let totalReplacements = 0;
for (const f of files) {
  let html = readFileSync(f, 'utf8');
  const orig = html;
  // Match "/js/i18n.js?v=NN" or "/js/i18n.js" (no version)
  html = html.replace(/\/js\/i18n\.js(?:\?v=(\d+))?/g, `/js/i18n.js?v=${NEW_I18N_VERSION}`);
  html = html.replace(/\/js\/layout\.js(?:\?v=(\d+))?/g, `/js/layout.js?v=${NEW_LAYOUT_VERSION}`);
  if (html !== orig) {
    writeFileSync(f, html, 'utf8');
    totalReplacements++;
    console.log('bumped:', f.replace(ROOT + '\\', ''));
  }
}
console.log(`Done. ${totalReplacements} file(s) bumped.`);