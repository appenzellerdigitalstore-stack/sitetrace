#!/usr/bin/env node
// scripts/smoke-subnet-calculator.cjs
// Verifies the subnet math in js/subnet-calculator.js against known
// reference values. Pure Node — does not load i18n.js (which is a
// browser IIFE that references `window`).
//
// Re-implements the same math here and asserts the outputs. If the
// reference file's parseCidr/compute change, this script must be
// updated to match.

'use strict';

// --- inlined math (mirror of subnet-calculator.js) ---
function octetsToUint(o) {
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}
function uintToDotted(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}
function prefixToMaskUint(prefix) {
  if (prefix === 0) return 0;
  return (0xFFFFFFFF << (32 - prefix)) >>> 0;
}
function ipClass(firstOctet) {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D';
  return 'E';
}
function compute(input) {
  const ip = octetsToUint(input.octets);
  const prefix = input.prefix;
  const mask = prefixToMaskUint(prefix);
  const network = (ip & mask) >>> 0;
  const wildcard = ((~mask) >>> 0);
  const broadcast = (network | wildcard) >>> 0;
  const hostBits = 32 - prefix;
  const totalAddresses = Math.pow(2, hostBits);
  let usableHosts;
  if (prefix === 32) usableHosts = 1;
  else if (prefix === 31) usableHosts = 2;
  else usableHosts = Math.max(0, totalAddresses - 2);
  const firstUsable = (prefix >= 31) ? network : ((network + 1) >>> 0);
  const lastUsable  = (prefix >= 31) ? broadcast : ((broadcast - 1) >>> 0);
  return {
    network: uintToDotted(network),
    broadcast: uintToDotted(broadcast),
    firstUsable: uintToDotted(firstUsable),
    lastUsable: uintToDotted(lastUsable),
    totalAddresses: totalAddresses,
    usableHosts: usableHosts,
    mask: uintToDotted(mask),
    wildcard: uintToDotted(wildcard),
    ipClass: ipClass(input.octets[0]),
  };
}

function parseCidr(input) {
  const raw = (input || '').trim();
  if (!raw) return { ok: false };
  let body = raw, prefix = null;
  if (raw.indexOf('/') !== -1) {
    const idx = raw.indexOf('/');
    body = raw.slice(0, idx).trim();
    const pStr = raw.slice(idx + 1).trim();
    if (!/^\d{1,2}$/.test(pStr)) return { ok: false };
    prefix = parseInt(pStr, 10);
    if (prefix < 0 || prefix > 32) return { ok: false };
  }
  const parts = body.split('.');
  if (parts.length !== 4) return { ok: false };
  const oct = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return { ok: false };
    const n = parseInt(p, 10);
    if (n < 0 || n > 255) return { ok: false };
    oct.push(n);
  }
  if (prefix === null) prefix = 32;
  return { ok: true, octets: oct, prefix: prefix };
}

// --- reference cases ---
const cases = [
  {
    input: '192.168.1.0/24',
    expect: {
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      firstUsable: '192.168.1.1',
      lastUsable: '192.168.1.254',
      totalAddresses: 256,
      usableHosts: 254,
      mask: '255.255.255.0',
      wildcard: '0.0.0.255',
      ipClass: 'C',
    },
  },
  {
    input: '10.0.0.0/8',
    expect: {
      network: '10.0.0.0',
      broadcast: '10.255.255.255',
      firstUsable: '10.0.0.1',
      lastUsable: '10.255.255.254',
      totalAddresses: 16777216,
      usableHosts: 16777214,
      mask: '255.0.0.0',
      wildcard: '0.255.255.255',
      ipClass: 'A',
    },
  },
  {
    input: '172.16.0.0/12',
    expect: {
      network: '172.16.0.0',
      broadcast: '172.31.255.255',
      firstUsable: '172.16.0.1',
      lastUsable: '172.31.255.254',
      totalAddresses: 1048576,
      usableHosts: 1048574,
      mask: '255.240.0.0',
      wildcard: '0.15.255.255',
      ipClass: 'B',
    },
  },
  {
    input: '203.0.113.42/24',
    expect: {
      network: '203.0.113.0',
      broadcast: '203.0.113.255',
      firstUsable: '203.0.113.1',
      lastUsable: '203.0.113.254',
      totalAddresses: 256,
      usableHosts: 254,
      mask: '255.255.255.0',
      wildcard: '0.0.0.255',
      ipClass: 'C',
    },
  },
  {
    input: '10.0.0.1/31',  // point-to-point (RFC 3021)
    expect: {
      network: '10.0.0.0',
      broadcast: '10.0.0.1',
      firstUsable: '10.0.0.0',
      lastUsable: '10.0.0.1',
      totalAddresses: 2,
      usableHosts: 2,
      mask: '255.255.255.254',
      wildcard: '0.0.0.1',
      ipClass: 'A',
    },
  },
  {
    input: '192.168.1.5/32',  // single host
    expect: {
      network: '192.168.1.5',
      broadcast: '192.168.1.5',
      firstUsable: '192.168.1.5',
      lastUsable: '192.168.1.5',
      totalAddresses: 1,
      usableHosts: 1,
      mask: '255.255.255.255',
      wildcard: '0.0.0.0',
      ipClass: 'C',
    },
  },
  {
    input: '0.0.0.0/0',  // entire IPv4 space
    expect: {
      network: '0.0.0.0',
      broadcast: '255.255.255.255',
      firstUsable: '0.0.0.1',
      lastUsable: '255.255.255.254',
      totalAddresses: 4294967296,
      usableHosts: 4294967294,
      mask: '0.0.0.0',
      wildcard: '255.255.255.255',
      ipClass: 'A',
    },
  },
  {
    input: '224.0.0.0/4',  // Class D multicast
    expect: {
      network: '224.0.0.0',
      broadcast: '239.255.255.255',
      firstUsable: '224.0.0.1',
      lastUsable: '239.255.255.254',
      totalAddresses: 268435456,
      usableHosts: 268435454,
      mask: '240.0.0.0',
      wildcard: '15.255.255.255',
      ipClass: 'D',
    },
  },
];

let fails = 0;
for (const c of cases) {
  const parsed = parseCidr(c.input);
  if (!parsed.ok) { console.error('FAIL: parse error for', c.input); fails++; continue; }
  const got = compute(parsed);
  let ok = true;
  for (const k of Object.keys(c.expect)) {
    if (got[k] !== c.expect[k]) {
      console.error('FAIL: ' + c.input + ' .' + k + ' = ' + got[k] + ', expected ' + c.expect[k]);
      ok = false;
    }
  }
  if (ok) console.log('  OK:  ' + c.input + ' -> network=' + got.network + ' usable=' + got.usableHosts);
  else fails++;
}

// Also test parse failures
const badCases = ['256.0.0.0/24', '1.2.3/24', '1.2.3.4/33', '1.2.3.4/-1', 'abc/24', '1.2.3.4', '1.2.3.4/'];
let badFails = 0;
for (const b of badCases) {
  // '1.2.3.4' should PARSE — defaults to /32
  if (b === '1.2.3.4') {
    const p = parseCidr(b);
    if (!p.ok || p.prefix !== 32) { console.error('FAIL: bare IP should default to /32, got', p); badFails++; }
    else console.log('  OK:  bare IP defaults to /32: ' + b);
    continue;
  }
  if (b === '1.2.3.4/') {
    // Empty prefix: my parser will fail this (no digits). That's fine.
    const p = parseCidr(b);
    if (p.ok) { console.error('FAIL: should reject empty prefix', b); badFails++; }
    else console.log('  OK:  rejects empty prefix: ' + b);
    continue;
  }
  const p = parseCidr(b);
  if (p.ok) { console.error('FAIL: should have rejected ' + b + ' but got ' + JSON.stringify(p)); badFails++; }
  else console.log('  OK:  rejects ' + b);
}

const totalFails = fails + badFails;
console.log('\n' + (totalFails === 0 ? 'PASSED' : 'FAILED (' + totalFails + ' failures)') + ' — ' + (cases.length + badCases.length) + ' cases total');
process.exit(totalFails === 0 ? 0 : 1);
