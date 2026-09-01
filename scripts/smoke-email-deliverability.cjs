#!/usr/bin/env node
// scripts/smoke-email-deliverability.cjs
// Verifies the email-deliverability logic against real public domains.
// We expect google.com and github.com to have SPF, DKIM, and DMARC.
// We expect a deliberately fake domain to come back with all records
// missing.

'use strict';

const DOH = 'https://cloudflare-dns.com/dns-query';
const TIMEOUT_MS = 6000;

async function doh(name, type) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(
      `${DOH}?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { 'Accept': 'application/dns-json' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!resp.ok) return { status: 'http_' + resp.status, answers: [] };
    const data = await resp.json();
    if (data.Status === 3) return { status: 'nxdomain', answers: [] };
    if (data.Status !== 0) return { status: 'dns_status_' + data.Status, answers: [] };
    return { status: 'ok', answers: (data.Answer || []).map(a => ({ data: a.data })) };
  } catch (e) {
    return { status: e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || 'error', answers: [] };
  }
}

function parseSpf(records) {
  const txts = records.filter(r => typeof r.data === 'string' && r.data.replace(/^"|"$/g, '').toLowerCase().indexOf('v=spf1') === 0);
  if (txts.length === 0) return { present: false };
  const raw = txts[0].data.replace(/^"|"$/g, '');
  const mechanisms = raw.split(/\s+/).slice(1);
  const all = mechanisms.filter(m => m === '-all' || m === '~all' || m === '?all' || m === '+all');
  return { present: true, record: raw, qualifier: all[0] || null, mechanismCount: mechanisms.length };
}

function parseDmarc(records) {
  const txts = records.filter(r => typeof r.data === 'string' && r.data.replace(/^"|"$/g, '').toLowerCase().indexOf('v=dmarc1') === 0);
  if (txts.length === 0) return { present: false };
  const raw = txts[0].data.replace(/^"|"$/g, '');
  const tags = {};
  raw.split(';').forEach(function (part) {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const k = part.slice(0, idx).trim().toLowerCase();
    const v = part.slice(idx + 1).trim();
    if (k) tags[k] = v;
  });
  return { present: true, record: raw, policy: (tags.p || 'none').toLowerCase() };
}

function parseMx(records) {
  if (records.length === 0) return { present: false, hosts: [] };
  return {
    present: true,
    hosts: records.map(r => {
      const parts = String(r.data || '').split(/\s+/);
      return { preference: parseInt(parts[0], 10) || 0, host: parts.slice(1).join(' ') };
    }).sort((a, b) => a.preference - b.preference),
  };
}

const DKIM_SELECTORS = ['default', 'google', 'k1', 's1', 's2', 'selector1', 'selector2', 'mail', 'dkim', 'mx', 'cm', 'mandrill', 'mailjet', 'sendgrid', 'mailgun', 'postmark', 'smtp', 'email', 'sig1', 'sig2'];

async function probeDkim(domain) {
  const results = await Promise.all(DKIM_SELECTORS.map(async sel => ({ selector: sel, records: (await doh(sel + '._domainkey.' + domain, 'TXT')).answers })));
  for (const r of results) {
    if (r.records.length > 0) {
      const txts = r.records.filter(x => typeof x.data === 'string' && x.data.replace(/^"|"$/g, '').toLowerCase().indexOf('v=dkim1') === 0);
      if (txts.length > 0) return { present: true, selector: r.selector };
    }
  }
  return { present: false };
}

async function checkDomain(domain) {
  const [spfRec, dmarcRec, mxRec] = await Promise.all([
    doh(domain, 'TXT'),
    doh('_dmarc.' + domain, 'TXT'),
    doh(domain, 'MX'),
  ]);
  const dkim = await probeDkim(domain);
  return {
    domain,
    spf: parseSpf(spfRec.answers),
    dkim,
    dmarc: parseDmarc(dmarcRec.answers),
    mx: parseMx(mxRec.answers),
  };
}

(async () => {
  const cases = ['google.com', 'github.com', 'sitrace.it.com', 'nonexistent-domain-zzz-12345.invalid'];
  for (const c of cases) {
    console.log('\n=== ' + c + ' ===');
    const r = await checkDomain(c);
    console.log('  SPF:   ' + (r.spf.present ? 'present, qualifier=' + r.spf.qualifier + ', ' + r.spf.mechanismCount + ' mechanisms' : 'MISSING'));
    console.log('  DKIM:  ' + (r.dkim.present ? 'present at ' + r.dkim.selector : 'MISSING (tried ' + DKIM_SELECTORS.length + ' common selectors)'));
    console.log('  DMARC: ' + (r.dmarc.present ? 'present, p=' + r.dmarc.policy : 'MISSING'));
    console.log('  MX:    ' + (r.mx.present ? r.mx.hosts.length + ' host(s): ' + r.mx.hosts.slice(0, 3).map(h => h.host).join(', ') : 'MISSING'));
  }
  console.log('\nSmoke test complete.');
})();
