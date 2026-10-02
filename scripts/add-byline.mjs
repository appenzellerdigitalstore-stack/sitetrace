// scripts/add-byline.mjs
//
// Inject the standard byline (// last updated YYYY-MM-DD · built by edy appenzeller · open source)
// into the hero or after the main heading of pages that don't have one yet.
// Idempotent: if a byline already exists, no change is made.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = 'F:\\.Projects\\sitetrace';

const PAGES = [
  'about/index.html',
  'blog/index.html',
  'blog/what-is-my-ip-address/index.html',
  'blog/how-to-read-ping-results/index.html',
  'blog/dns-propagation/index.html',
];

const BYLINE = '<p class="byline justify-center mt-4">last updated 2026-10-02 · built by edy appenzeller · open source</p>';

for (const page of PAGES) {
  const path = resolve(ROOT, page);
  let html = readFileSync(path, 'utf8');
  if (html.includes('class="byline')) {
    console.log(`${page}: byline already present, skipping`);
    continue;
  }

  // Find a target insertion point: either the first <h1> (and inject after its parent)
  // or, if no <h1>, the first <h2> in <main>.
  const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/);
  if (h1Match) {
    const insertAt = html.indexOf(h1Match[0]) + h1Match[0].length;
    html = html.slice(0, insertAt) + '\n  ' + BYLINE + html.slice(insertAt);
    writeFileSync(path, html, 'utf8');
    console.log(`${page}: byline inserted after <h1>`);
  } else {
    console.log(`${page}: no <h1> found, manual add needed`);
  }
}