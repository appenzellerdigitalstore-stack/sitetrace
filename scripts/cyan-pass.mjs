// scripts/cyan-pass.mjs
//
// Apply cyan+sage-Tailwind + IBM Plex Sans + JetBrains Mono + cyan favicon swap
// to a list of pages that haven't yet been touched. Idempotent.
//
// Usage: node scripts/cyan-pass.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = 'F:\\.Projects\\sitetrace';

const PAGES = [
  'about/index.html',
  'privacy/index.html',
  'blog/index.html',
  'blog/what-is-my-ip-address/index.html',
  'blog/how-to-read-ping-results/index.html',
  'blog/dns-propagation/index.html',
];

const SUBSTITUTIONS = [
  {
    from: "['Inter','system-ui','-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','sans-serif']",
    to: "['IBM Plex Sans','system-ui','-apple-system','BlinkMacSystemFont','Segoe UI','sans-serif']",
  },
  {
    from: "brand: { 50:'#eef3ff', 100:'#dbe4ff', 200:'#b6c8ff', 300:'#8aa6ff', 400:'#5e83ff', 500:'#3b62f4', 600:'#2a48d6', 700:'#1f37a8', 800:'#1a2c80', 900:'#16235f' }",
    to: "brand: { 50:'#ecfeff', 100:'#cffafe', 200:'#a5f3fc', 300:'#67e8f9', 400:'#22d3ee', 500:'#06b6d4', 600:'#0891b2', 700:'#0e7490', 800:'#155e75', 900:'#164e63' }",
  },
  {
    from: "'brand-gradient': 'linear-gradient(135deg,#5e83ff 0%,#8b5cf6 50%,#c084fc 100%)'",
    to: "'brand-gradient': 'linear-gradient(135deg,#22d3ee 0%,#14b8a6 50%,#0d9488 100%)'",
  },
  {
    from: "'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(94,131,255,0.18), transparent 70%)'",
    to: "'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.18), transparent 70%)'",
  },
  {
    from: "'glow-brand': '0 0 0 1px rgba(94,131,255,0.18), 0 12px 40px -12px rgba(94,131,255,0.35)'",
    to: "'glow-brand': '0 0 0 1px rgba(34, 211, 238, 0.22), 0 12px 40px -12px rgba(34, 211, 238, 0.4)'",
  },
  {
    from: '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />',
    to: '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />',
  },
  {
    from: "stop-color='%235e83ff'/%3E%3Cstop offset='100%25' stop-color='%238b5cf6'",
    to: "stop-color='%2322d3ee'/%3E%3Cstop offset='100%25' stop-color='%2314b8a6'",
  },
  {
    from: "stroke='white' stroke-width='6'",
    to: "stroke='%23070a12' stroke-width='7'",
  },
  // Older light-favicon variant that some pages ship with
  {
    from: "stop-color='%235e83ff'/%3E%3Cstop offset='100%25' stop-color='%23ffffff'",
    to: "stop-color='%2322d3ee'/%3E%3Cstop offset='100%25' stop-color='%2314b8a6'",
  },
];

for (const page of PAGES) {
  const path = resolve(ROOT, page);
  let html = readFileSync(path, 'utf8');
  let changed = 0;
  for (const { from, to } of SUBSTITUTIONS) {
    if (html.includes(from)) {
      html = html.split(from).join(to);
      changed++;
    }
  }
  if (changed > 0) {
    writeFileSync(path, html, 'utf8');
    console.log(`${page}: ${changed} substitutions applied`);
  } else {
    console.log(`${page}: no changes needed`);
  }
}