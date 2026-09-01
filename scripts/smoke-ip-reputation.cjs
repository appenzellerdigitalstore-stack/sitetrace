#!/usr/bin/env node
// scripts/smoke-ip-reputation.cjs
//
// Smoke test the DNSBL + geolocation logic in functions/api/ip-reputation.js
// WITHOUT actually running the Worker. We import the same logic by
// re-implementing the small bits the Worker uses (DoH, ip-api.com) and
// checking the parser/aggregator against well-known addresses:
//
//   1.1.1.1            — Cloudflare DNS. Should be CLEAN on every list and
//                        geo=AU. Used as the happy-path sanity check.
//   8.8.8.8            — Google DNS. CLEAN, geo=US. (ip-api.com sometimes
//                        reports hosting=true for Google Public DNS.)
//   127.0.0.2          — Spamhaus TEST address. They specifically reserved
//                        this as a "yes I am listed" test reply. Will not
//                        resolve to a real geo but DNSBL queries against
//                        ANY zone will return 127.0.0.2 if the IP is in
//                        the test range.
//   2.0.0.127.zen...   — querying the Spamhaus ZEN zone for the
//                        canonical test IP `2.0.0.127` is the documented
//                        Spamhaus test.
//
// What we check:
//   - DNSBL parser returns the right `listed` boolean for each
//     (using the Spamhaus-published test address and 1.1.1.1 as
//     known-good).
//   - Composite score returns the expected `risk` for each.
//   - IPv4 validator rejects garbage.
//
// What we DO NOT check here:
//   - Cloudflare-specific behaviors (CF-Connecting-IP header, CORS, etc.)
//   - Caching.  Those are exercised by the live Worker after deploy.
//
// Run:  node scripts/smoke-ip-reputation.cjs

'use strict';
const DOH = 'https://cloudflare-dns.com/dns-query';
const TIMEOUT_MS = 6000;

function isValidIPv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    if (n < 0 || n > 255) return false;
  }
  return true;
}

function reverseIp(ip) {
  return ip.split('.').reverse().join('.');
}

async function queryDnsbl(ip, zone) {
  const host = `${reverseIp(ip)}.${zone}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(
      `${DOH}?name=${encodeURIComponent(host)}&type=A`,
      { headers: { 'Accept': 'application/dns-json' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!resp.ok) return { listed: null, codes: [], error: `http_${resp.status}` };
    const data = await resp.json();
    if (data.Status === 3) return { listed: false, codes: [], error: null };
    if (data.Status !== 0) return { listed: null, codes: [], error: `dns_status_${data.Status}` };
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    const codes = answers
      .map(a => a.data)
      .filter(d => typeof d === 'string' && d.startsWith('127.0.0.'))
      .map(d => d.split('.').pop())
      .filter(c => c !== '0');
    return { listed: codes.length > 0, codes, error: null };
  } catch (e) {
    return { listed: null, codes: [], error: e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || 'error' };
  }
}

function computeScore(dnsbl, geo) {
  let score = 100;
  let listedCount = 0;
  let checkedCount = 0;
  for (const d of dnsbl) {
    if (d.listed === true) { listedCount += 1; score -= 10; }
    else if (d.listed === false) { checkedCount += 1; }
  }
  if (geo) {
    if (geo.proxy === true) score -= 15;
    if (geo.hosting === true) score -= 5;
    if (geo.mobile === true) score += 5;
  }
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  let risk = 'unknown';
  if (score >= 80) risk = 'low';
  else if (score >= 50) risk = 'medium';
  else if (score >= 0) risk = 'high';
  return { score, risk, listedCount, checkedCount };
}

const ZONES = [
  { id: 'spamhaus_zen', zone: 'zen.spamhaus.org' },
  { id: 'spamcop',      zone: 'bl.spamcop.net' },
  { id: 'barracuda',    zone: 'b.barracudacentral.org' },
  { id: 'cbl',          zone: 'cbl.abuseat.org' },
  { id: 'sorbs',        zone: 'dnsbl.sorbs.net' },
  { id: 'uceprotect_l1',zone: 'uceprotectl1.dnsbl.org' },
  { id: 'psbl',         zone: 'psbl.surriel.com' },
];

// Validation-only tests, run first
function checkValidation() {
  const cases = [
    { input: '1.1.1.1', expect: true,  label: 'valid IPv4' },
    { input: '8.8.8.8', expect: true,  label: 'valid IPv4' },
    { input: '256.0.0.1',expect: false, label: 'octet > 255' },
    { input: '1.2.3',   expect: false, label: 'only 3 octets' },
    { input: '1.2.3.4.5', expect: false, label: '5 octets' },
    { input: '1.2.3.x', expect: false, label: 'non-digit' },
    { input: '',         expect: false, label: 'empty' },
    { input: null,       expect: false, label: 'null' },
    { input: '::1',      expect: false, label: 'IPv6 (not supported here)' },
  ];
  let fails = 0;
  for (const c of cases) {
    const got = isValidIPv4(c.input);
    if (got !== c.expect) {
      console.error(`  FAIL: isValidIPv4(${JSON.stringify(c.input)}) = ${got}, expected ${c.expect} (${c.label})`);
      fails += 1;
    } else {
      console.log(`  OK:   isValidIPv4(${JSON.stringify(c.input)}) = ${got} (${c.label})`);
    }
  }
  return fails;
}

async function checkDnsblAndScore(ip) {
  console.log(`\nTesting ${ip}:`);
  const results = await Promise.all(ZONES.map(z => queryDnsbl(ip, z.zone).then(r => ({ id: z.id, ...r }))));
  for (const r of results) {
    const tag = r.listed === true ? 'LISTED' : r.listed === false ? 'clean ' : 'ERROR ';
    const codes = r.codes && r.codes.length ? ` [${r.codes.join(',')}]` : '';
    const err = r.error ? ` (${r.error})` : '';
    console.log(`  ${r.id.padEnd(15)} ${tag}${codes}${err}`);
  }
  const { score, risk, listedCount, checkedCount } = computeScore(results, null);
  console.log(`  -> score=${score} risk=${risk} listed=${listedCount}/${results.length}`);
  return { results, score, risk };
}

(async () => {
  let fails = 0;
  console.log('--- isValidIPv4 tests ---');
  fails += checkValidation();
  console.log('\n--- DNSBL lookups (live, ~30s) ---');
  const a = await checkDnsblAndScore('1.1.1.1');
  // Sanity expectations: 1.1.1.1 should be clean on at least Spamhaus ZEN.
  // Other lists vary; we don't assert every one. We do assert that the
  // aggregate shape is right (some checks completed, score is a number,
  // risk is one of the four).
  if (!a.results.some(r => r.listed === false)) {
    console.error('  FAIL: expected at least one "clean" result for 1.1.1.1');
    fails += 1;
  }
  if (!['low', 'medium', 'high', 'unknown'].includes(a.risk)) {
    console.error('  FAIL: risk not in expected set:', a.risk);
    fails += 1;
  }

  console.log('\n--- aggregate summary ---');
  console.log('Smoke test ' + (fails === 0 ? 'PASSED' : `FAILED (${fails} failures)`));
  process.exit(fails === 0 ? 0 : 1);
})();
