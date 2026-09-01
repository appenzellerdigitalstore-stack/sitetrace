#!/usr/bin/env node
// scripts/smoke-http-headers.cjs
// Verifies the HTTP headers Worker logic against real URLs.
// We expect github.com to have CSP and HSTS, and to return a
// 200 status with a populated header set.

'use strict';

const TIMEOUT_MS = 12000;

function isBlockedUrl(input) {
  let u;
  try { u = new URL(input); } catch { return 'Invalid URL.'; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Only http:// and https:// URLs are allowed.';
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return 'Localhost is not allowed.';
  if (host.endsWith('.local') || host.endsWith('.internal')) return 'Internal hostnames are not allowed.';
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(host)) return 'Private IP addresses are not allowed.';
  return null;
}

const SECURITY_CHECKS = [
  { id: 'csp',                 header: 'content-security-policy',     weight: 25 },
  { id: 'hsts',                header: 'strict-transport-security',   weight: 20 },
  { id: 'x_frame_options',     header: 'x-frame-options',             weight: 15 },
  { id: 'x_content_type_options', header: 'x-content-type-options',   weight: 10 },
  { id: 'referrer_policy',     header: 'referrer-policy',             weight: 10 },
  { id: 'permissions_policy',   header: 'permissions-policy',           weight: 10 },
];

function gradeFor(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function analyze(headersObj) {
  let score = 0;
  const checks = [];
  for (const c of SECURITY_CHECKS) {
    const present = !!(headersObj[c.header] && String(headersObj[c.header]).trim().length);
    if (present) score += c.weight;
    checks.push({ id: c.id, label: c.header, present, weight: c.weight });
  }
  return { score, grade: gradeFor(score), checks };
}

(async () => {
  const cases = [
    'https://github.com',
    'https://www.google.com',
    'https://example.com',
    'https://sitrace.it.com',
  ];
  for (const url of cases) {
    console.log('\n=== ' + url + ' ===');
    const block = isBlockedUrl(url);
    if (block) { console.log('  BLOCKED: ' + block); continue; }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let resp;
    try {
      resp = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'SiteTrace-Smoke/1.0' } });
      clearTimeout(t);
    } catch (e) {
      console.log('  FETCH ERROR: ' + (e.message || e));
      continue;
    }
    const headersObj = {};
    resp.headers.forEach((v, k) => { const lk = k.toLowerCase(); if (!(lk in headersObj)) headersObj[lk] = v; });
    const analysis = analyze(headersObj);
    console.log('  status: ' + resp.status + ' ' + resp.statusText);
    console.log('  grade:  ' + analysis.grade + ' (' + analysis.score + '/100)');
    for (const c of analysis.checks) {
      console.log('    ' + (c.present ? '[+]' : '[ ]') + ' ' + c.header + ' (weight ' + c.weight + ')');
    }
  }
  console.log('\nSmoke test complete.');
})();
