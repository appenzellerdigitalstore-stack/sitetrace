// scripts/audit-ai.mjs
//
// Run an HTML file through sitetrace-api's /api/ai-content-detector.
// Strips scripts, JSON-LD, and tags to get a clean prose sample.
//
// Usage: node scripts/audit-ai.mjs <file.html> [api_key]

import { readFileSync } from 'node:fs';

const key = process.argv[3] || process.env.SITETRACE_KEY;
const file = process.argv[2];
if (!key || !file) {
  console.error('Usage: node audit-ai.mjs <file.html> [api_key]');
  process.exit(1);
}

let html = readFileSync(file, 'utf8');

// Strip scripts, JSON-LD, style, svg, head
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
html = html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');
html = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, ' ');
html = html.replace(/<[^>]+>/g, ' ');
html = html.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&[a-z]+;/gi, ' ');
html = html.replace(/\s+/g, ' ').trim();

// Take first ~3500 chars (sample, not full doc — detector doesn't need more)
const text = html.slice(0, 3500);
console.log(`Sample: ${text.length} chars from ${file}`);

const resp = await fetch('https://api.sitetrace.it.com/api/ai-content-detector', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
  body: JSON.stringify({ text }),
});
const data = await resp.json();
console.log(`Status: ${resp.status}`);
console.log(JSON.stringify(data, null, 2));
