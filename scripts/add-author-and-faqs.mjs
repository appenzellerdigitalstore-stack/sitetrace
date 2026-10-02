// scripts/add-author-and-faqs.mjs
//
// For pages that don't yet have a <meta name="author"> or an FAQPage schema,
// add the canonical author meta. Skips pages that already have one.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = 'F:\\.Projects\\sitetrace';
const AUTHOR_META = '  <meta name="author" content="Edy Appenzeller" />';

const PAGES = [
  'about/index.html',
  'privacy/index.html',
  'blog/index.html',
  'blog/what-is-my-ip-address/index.html',
  'blog/how-to-read-ping-results/index.html',
  'blog/dns-propagation/index.html',
];

for (const page of PAGES) {
  const path = resolve(ROOT, page);
  let html = readFileSync(path, 'utf8');
  if (html.includes('name="author"')) {
    console.log(`${page}: author already present`);
    continue;
  }
  // Insert author meta after the robots meta line
  const robotsMatch = html.match(/<meta name="robots"[^>]*>\s*/);
  if (robotsMatch) {
    const insertAt = html.indexOf(robotsMatch[0]) + robotsMatch[0].length;
    html = html.slice(0, insertAt) + AUTHOR_META + '\n' + html.slice(insertAt);
    writeFileSync(path, html, 'utf8');
    console.log(`${page}: author added`);
  } else {
    console.log(`${page}: no robots meta, manual add needed`);
  }
}