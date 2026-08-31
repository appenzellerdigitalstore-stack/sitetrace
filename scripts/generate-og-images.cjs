// Generate per-page og:image (1200x630 PNG) for every important page.
// Design: dark background, SiteTrace branding, page-specific title and subtitle.
// Output: /og/<slug>.png for each entry in PAGES below.
//
// Uses sharp's libvips backend to render SVG to PNG. Single dependency
// (sharp) — no canvas, no playwright, no headless browser.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, '..', 'og');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Per-page content. slug = filename (under /og/), title = H1-equivalent,
// subtitle = 1-2 line value prop, accent = a brand-color hint.
const PAGES = [
  { slug: 'home',                 title: 'Five free network tools',     subtitle: 'IP · ping · DNS · is-it-down · SEO checker',                accent: '#5e83ff' },
  { slug: 'what-is-my-ip',        title: 'What is my IP address?',       subtitle: 'Your public IP, location, ISP, and connection privacy', accent: '#5e83ff' },
  { slug: 'ping',                 title: 'Domain inspector',            subtitle: 'DNS records, IPs, reachability, and latency in one shot', accent: '#10b981' },
  { slug: 'dns-tools',            title: 'DNS lookup',                  subtitle: 'Every record type for any domain, over DNS-over-HTTPS', accent: '#8b5cf6' },
  { slug: 'is-it-down',           title: 'Is it down for me?',          subtitle: 'Live status for 50+ popular services',                    accent: '#f59e0b' },
  { slug: 'seo-checker',          title: 'Free SEO checker',            subtitle: '12-point SEO audit in seconds — no signup',                accent: '#f43f5e' },
  { slug: 'ip-lookup',            title: 'IP address lookup',           subtitle: 'Look up any IP — geolocation, ISP, and connection type',  accent: '#5e83ff' },
  { slug: 'vpn-checker',          title: 'VPN checker',                 subtitle: 'Is your VPN actually working?',                              accent: '#a78bfa' },
  { slug: 'website-down-checker', title: 'Website down checker',        subtitle: 'Is it down for me or for everyone?',                        accent: '#f59e0b' },
  { slug: 'dns-propagation-checker', title: 'DNS propagation checker', subtitle: 'See when your DNS changes go live',                        accent: '#8b5cf6' },
  { slug: 'network-tools',        title: 'Free network tools',          subtitle: 'Five browser-based utilities, no signup',                   accent: '#22d3ee' },
  { slug: 'blog',                 title: 'SiteTrace blog',              subtitle: 'Networking, explained — short, practical articles',        accent: '#22d3ee' },
  { slug: 'blog-dns-propagation', title: 'What is DNS propagation?',    subtitle: 'And how long does it really take?',                          accent: '#8b5cf6' },
  { slug: 'blog-what-is-my-ip',    title: 'What is my IP address?',      subtitle: 'And why does it matter?',                                   accent: '#5e83ff' },
  { slug: 'blog-how-to-read-ping', title: 'How to read a ping test',    subtitle: 'Latency numbers, explained',                                accent: '#10b981' },
];

// --- helpers ---------------------------------------------------------

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Word-wrap the subtitle into N lines that fit within a max width.
// Uses approximate character width: at 32px font, ~18-20 chars per 220px.
function wrapSubtitle(text, maxCharsPerLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + ' ' + w).length <= maxCharsPerLine) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function buildSvg(p) {
  const W = 1200, H = 630;
  const titleSafe = escapeXml(p.title);
  const subLines = wrapSubtitle(p.subtitle, 36);
  const subSafe = subLines.map(escapeXml);
  const accent = p.accent || '#5e83ff';
  const url = 'sitetrace.it.com/' + p.slug;

  // Title font: 84px, weight 800. Two-line cap.
  const titleMaxChars = 22;
  const titleLines = wrapSubtitle(p.title, titleMaxChars).slice(0, 2);
  const titleSafeLines = titleLines.map(escapeXml);
  const titleY = 290;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0e1a"/>
      <stop offset="1" stop-color="#0d1424"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.7">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.18"/>
      <stop offset="0.5" stop-color="${accent}" stop-opacity="0.06"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5e83ff"/>
      <stop offset="0.5" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#c084fc"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Subtle dot grid -->
  <g opacity="0.06" fill="#ffffff">
    ${Array.from({ length: 18 }, (_, i) => Array.from({ length: 10 }, (_, j) => `<circle cx="${60 + i * 64}" cy="${60 + j * 56}" r="1"/>`).join('')).join('')}
  </g>

  <!-- Logo + wordmark -->
  <g transform="translate(80, 80)">
    <rect width="56" height="56" rx="14" fill="url(#brand)"/>
    <path d="M14 28 L21 28 L24 19 L29 37 L33 28 L42 28" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="78" y="38" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="28" font-weight="700" fill="#f8fafc">SiteTrace</text>
  </g>

  <!-- Eyebrow -->
  <g transform="translate(80, 188)">
    <rect width="100" height="28" rx="14" fill="${accent}" fill-opacity="0.14"/>
    <rect width="100" height="28" rx="14" fill="none" stroke="${accent}" stroke-opacity="0.4"/>
    <text x="50" y="19" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="${accent}">FREE TOOL</text>
  </g>

  <!-- Title (1 or 2 lines) -->
  <g font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="800" fill="#ffffff">
    ${titleSafeLines.map((line, i) => `<text x="80" y="${titleY + i * 90}" font-size="84" letter-spacing="-2">${line}</text>`).join('')}
  </g>

  <!-- Subtitle (1-2 lines) -->
  <g font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="500" fill="#94a3b8">
    ${subSafe.map((line, i) => `<text x="80" y="${titleY + titleSafeLines.length * 90 + 24 + i * 44}" font-size="32">${line}</text>`).join('')}
  </g>

  <!-- Bottom row: tagline left, URL right -->
  <g font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
    <text x="80" y="566" font-size="20" font-weight="600" fill="#cbd5e1">No login · No install · No tracking</text>
    <text x="${W - 80}" y="566" text-anchor="end" font-size="22" font-weight="600" font-family="ui-monospace, SFMono-Regular, JetBrains Mono, Menlo, monospace" fill="#94a3b8">${escapeXml(url)}</text>
  </g>
</svg>`;
}

async function main() {
  console.log('Generating ' + PAGES.length + ' og:images...');
  for (const p of PAGES) {
    const svg = buildSvg(p);
    const svgPath = path.join(OUT_DIR, p.slug + '.svg');
    const pngPath = path.join(OUT_DIR, p.slug + '.png');
    fs.writeFileSync(svgPath, svg);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, quality: 90 })
      .toFile(pngPath);
    const stat = fs.statSync(pngPath);
    console.log('  ' + p.slug + '.png  ' + (stat.size / 1024).toFixed(1) + ' KB');
    // Remove the SVG to keep the repo clean — only the PNG is needed.
    fs.unlinkSync(svgPath);
  }
  console.log('Done. Wrote ' + PAGES.length + ' images to ' + path.relative(process.cwd(), OUT_DIR) + '/');
}

main().catch((e) => { console.error(e); process.exit(1); });
