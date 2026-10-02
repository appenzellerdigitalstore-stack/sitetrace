// scripts/batch-audit-ai.mjs
//
// Run audit-ai.mjs against a list of HTML files, collect results, print summary.
// Usage: node scripts/batch-audit-ai.mjs

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = 'F:\\.Projects\\sitetrace';
const KEY = process.env.SITETRACE_KEY;

const PAGES = [
  'ping/index.html',
  'dns-tools/index.html',
  'email-deliverability/index.html',
  'http-headers/index.html',
  'ip-lookup/index.html',
  'ip-reputation/index.html',
  'seo-checker/index.html',
  'vpn-checker/index.html',
  'subnet-calculator/index.html',
  'dns-propagation-checker/index.html',
  'website-down-checker/index.html',
  'what-is-my-ip/index.html',
  'is-it-down/index.html',
  'network-tools/index.html',
];

if (!KEY) { console.error('Set $env:SITETRACE_KEY'); process.exit(1); }

const results = [];
for (const p of PAGES) {
  const path = join(ROOT, p);
  let html = readFileSync(path, 'utf8');
  // Strip scripts, JSON-LD, style, svg, head
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
  html = html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');
  html = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, ' ');
  html = html.replace(/<[^>]+>/g, ' ');
  html = html.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&[a-z]+;/gi, ' ');
  html = html.replace(/\s+/g, ' ').trim();
  const text = html.slice(0, 3500);
  try {
    const resp = await fetch('https://api.sitetrace.it.com/api/ai-content-detector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ text }),
    });
    const data = await resp.json();
    const d = data.data || {};
    results.push({ page: p, ai: d.ai_probability, label: d.label, phrases: d.signals?.ai_phrases_detected, burstiness: d.signals?.burstiness_score, status: resp.status });
  } catch (e) {
    results.push({ page: p, error: e.message });
  }
}

console.log('\n=== AI Content Audit — sitetrace.it.com tool pages ===\n');
console.log('Page'.padEnd(38) + 'AI%  Label          Phrases  Burstiness');
console.log('-'.repeat(75));
for (const r of results) {
  if (r.error) {
    console.log(r.page.padEnd(38) + `ERR: ${r.error}`);
  } else {
    const color = r.ai < 30 ? '✓' : '✗';
    console.log(`${r.page.padEnd(36)} ${String(r.ai).padStart(3)}%  ${(r.label || '').padEnd(14)} ${String(r.phrases ?? '-').padStart(3)}      ${String(r.burstiness ?? '-').padStart(4)}  ${color}`);
  }
}
const pass = results.filter(r => !r.error && r.ai < 30).length;
const total = results.length;
console.log(`\n${pass}/${total} pages under 30% AI threshold.`);
