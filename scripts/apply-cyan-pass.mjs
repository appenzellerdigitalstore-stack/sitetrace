// scripts/apply-cyan-pass.mjs
//
// One-shot rewrite: take each old tool page (Inter + brand-blue Tailwind config
// + no engineer signals) and apply the cyan trace system used by /what-is-my-ip/
// and /is-it-down/. Doesn't touch the page-specific inline <style> blocks (those
// keep their tool-specific colors like .ping-reach-pill--up). Just:
//   1. Swap the Tailwind config to cyan (#22d3ee family instead of #5e83ff)
//   2. Insert a cyan trace-token <style> block after the page-specific styles
//   3. Insert the byline just before the </section> of the hero (or after the
//      hero subtitle <p>, whichever comes first)
//
// Idempotent: if a page already has the cyan Tailwind config (fontFamily starts
// with IBM Plex Sans), it skips.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'F:\\.Projects\\sitetrace';

const TOOL_PAGES = [
  'ping',
  'dns-tools',
  'email-deliverability',
  'http-headers',
  'ip-reputation',
  'ip-lookup',
  'seo-checker',
  'vpn-checker',
  'subnet-calculator',
  'dns-propagation-checker',
  'website-down-checker',
];

const CYAN_TAILWIND = `  <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: { extend: {
        fontFamily: { sans: ['IBM Plex Sans','system-ui','-apple-system','BlinkMacSystemFont','Segoe UI','sans-serif'], mono: ['JetBrains Mono','ui-monospace','SFMono-Regular','Menlo','monospace'] },
        colors: { ink: { 900:'#070a12', 800:'#0b1120', 700:'#0f172a', 600:'#1a2438', 500:'#222d44' }, brand: { 300:'#67e8f9', 400:'#22d3ee', 500:'#06b6d4' }, safe: { 400:'#34d399', 500:'#10b981' }, warn: { 400:'#fbbf24', 500:'#f59e0b' }, danger: { 400:'#f87171', 500:'#ef4444' } },
        backgroundImage: { 'brand-gradient': 'linear-gradient(135deg,#22d3ee 0%,#14b8a6 50%,#0d9488 100%)', 'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.18), transparent 70%)' },
        boxShadow: { 'glow-brand': '0 0 0 1px rgba(34, 211, 238, 0.22), 0 12px 40px -12px rgba(34, 211, 238, 0.4)', 'glow-soft': '0 0 0 1px rgba(255,255,255,0.06), 0 8px 30px -10px rgba(0,0,0,0.5)' }
      } },
    };
  </script>`;

const OLD_TAILWIND_PATTERNS = [
  /<script src="https:\/\/cdn\.tailwindcss\.com\?[^"]*"><\/script>\s*<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\}\s*;\s*<\/script>/,
];

const CYAN_STYLE_BLOCK = `

  <style>
    /* ===== SiteTrace — premium cyan overrides (no Inter, no AI purple) ===== */
    :root {
      --trace-bg: #070a12;
      --trace-cyan: #22d3ee;
      --trace-cyan-deep: #0891b2;
      --trace-cyan-soft: #67e8f9;
      --trace-amber: #fbbf24;
      --trace-safe: #34d399;
      --trace-warn: #fb923c;
      --trace-bad: #f87171;
      --trace-border: rgba(34, 211, 238, 0.08);
      --trace-border-strong: rgba(34, 211, 238, 0.18);
    }
    body {
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--trace-bg);
    }
    .font-sans { font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important; }
    .font-mono, code, pre, kbd, samp { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace !important; }

    .bg-brand-gradient { background: linear-gradient(135deg, #22d3ee 0%, #14b8a6 50%, #0d9488 100%) !important; }
    .bg-hero-glow { background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.18), transparent 70%) !important; }
    .shadow-glow-brand { box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.22), 0 12px 40px -12px rgba(34, 211, 238, 0.4) !important; }

    .text-brand-300 { color: #67e8f9 !important; }
    .text-brand-400 { color: #22d3ee !important; }
    .text-brand-500 { color: #06b6d4 !important; }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(34, 211, 238, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(34, 211, 238, 0.025) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 0;
    }
    body > * { position: relative; z-index: 1; }

    .card {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.4)) !important;
      border: 1px solid var(--trace-border) !important;
      transition: border-color 200ms ease;
    }
    .card:hover { border-color: var(--trace-border-strong) !important; }

    .byline {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
      color: rgb(100, 116, 139); letter-spacing: 0.02em;
    }
    .byline::before { content: '//'; color: var(--trace-cyan-deep); }

    .source-link {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.25rem 0.55rem; border-radius: 9999px;
      font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
      color: var(--trace-cyan);
      background: rgba(34, 211, 238, 0.08);
      border: 1px solid var(--trace-border);
      text-decoration: none; transition: all 150ms ease;
    }
    .source-link:hover { color: var(--trace-cyan-soft); background: rgba(34, 211, 238, 0.14); border-color: var(--trace-border-strong); }

    :focus-visible { outline-color: rgba(34, 211, 238, 0.7) !important; }
  </style>`;

const BYLINE = `<p class="byline justify-center">last updated 2026-10-02 · built by edy appenzeller · open source</p>`;

// Heuristic: insert byline just before </section> if we find a hero section with the
// "mx-auto space-y-3" pattern (the typical hero block). Falls back to inserting
// before the closing </section> of the first <section class="pt-8 sm:pt-12">.
function insertByline(html) {
  if (html.includes('class="byline justify-center"')) return html; // already done
  const heroRe = /(<section class="pt-8 sm:pt-12[\s\S]*?<\/div>)\s*<\/section>/;
  if (heroRe.test(html)) {
    return html.replace(heroRe, '$1\n        ' + BYLINE + '\n      </section>');
  }
  return html;
}

let processed = 0, skipped = 0, errors = [];

for (const page of TOOL_PAGES) {
  const path = join(ROOT, page, 'index.html');
  let html;
  try {
    html = readFileSync(path, 'utf8');
  } catch (e) {
    errors.push(`${page}: ${e.message}`);
    continue;
  }

  // Idempotency check: if the cyan config is already present, skip.
  if (html.includes("'IBM Plex Sans','system-ui'")) {
    skipped++;
    continue;
  }

  // 1. Replace the Tailwind config.
  let updated = html;
  let replaced = false;
  for (const re of OLD_TAILWIND_PATTERNS) {
    if (re.test(updated)) {
      updated = updated.replace(re, CYAN_TAILWIND);
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    errors.push(`${page}: old Tailwind config pattern not found`);
    continue;
  }

  // 2. Insert the cyan style block just before </head>.
  if (!updated.includes('SiteTrace — premium cyan overrides')) {
    updated = updated.replace('</head>', `${CYAN_STYLE_BLOCK}\n</head>`);
  }

  // 3. Insert the byline into the hero section.
  updated = insertByline(updated);

  writeFileSync(path, updated, 'utf8');
  processed++;
}

console.log(`Processed: ${processed}\nSkipped (already cyan): ${skipped}\nErrors: ${errors.length}`);
for (const e of errors) console.log('  -', e);