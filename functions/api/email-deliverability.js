// =====================================================================
// SiteTrace — Free Email Deliverability Check (Cloudflare Pages Function)
//
// Endpoint: POST /api/email-deliverability  (body: { domain: "example.com" })
//           GET  /api/email-deliverability?domain=example.com
//
// What it does:
//   1. Resolves the domain's MX records (where incoming mail is
//      delivered) and gets the IPv4 of the lowest-preference host.
//   2. Queries SPF: TXT record at the apex (`example.com`).
//   3. Queries DMARC: TXT record at `_dmarc.example.com`.
//   4. Queries DKIM: tries a list of common selectors and reports
//      the first one that returns a valid `v=DKIM1` record.
//   5. Queries BIMI (optional): TXT at `default._bimi.example.com`.
//   6. Computes a 0–100 deliverability score and a Low/Medium/High
//      risk label from the combined record analysis.
//
// All DNS queries go through Cloudflare's DNS-over-HTTPS endpoint
// (`https://cloudflare-dns.com/dns-query`). The same Worker is called
// from any client; no API keys needed; no rate limits at the volume
// one-pager traffic will see.
//
// Notes for future-you:
//   - We DO NOT verify DKIM signatures. Just checks the public key
//     record exists, which is the right thing for a "do I have DKIM
//     configured" check. Verifying signatures requires a real
//     message to verify against.
//   - The DKIM selector list is a curated guess of common defaults.
//     A domain using a custom selector will report "DKIM not found"
//     even if DKIM is actually configured. To find an unknown
//     selector, you'd need to look at the mail server's config or
//     inspect the raw email headers from a sent message.
// =====================================================================

const DOH = 'https://cloudflare-dns.com/dns-query';
const TIMEOUT_MS = 6000;

// Common DKIM selectors — the most-deployed defaults across major
// ESPs (Google Workspace, Microsoft 365, Mailgun, SendGrid, Mailjet,
// Postmark, etc.). A custom selector will be missed by this list;
// that's a known limitation, not a bug.
const DKIM_SELECTORS = [
  'default', 'google', 'k1', 's1', 's2', 'selector1', 'selector2',
  'mail', 'dkim', 'mx', 'cm', 'mandrill', 'mailjet', 'sendgrid',
  'mailgun', 'postmark', 'smtp', 'email', 'sig1', 'sig2',
];

// ---------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------
function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      // 5-min edge cache. Record presence rarely changes minute-to-
      // minute; DNS results can be cached for short windows safely.
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------
function isValidDomain(input) {
  if (!input || typeof input !== 'string') return false;
  // Strip protocol if present.
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  // Domain shape: labels separated by dots, each 1-63 chars,
  // letters/digits/hyphens, TLD at least 2 chars, no leading/trailing
  // hyphen in any label.
  if (s.length > 253) return false;
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(s)) return false;
  return true;
}

// ---------------------------------------------------------------------
// DNS over HTTPS (Cloudflare)
// ---------------------------------------------------------------------
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
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    return { status: 'ok', answers: answers.map(function (a) { return { name: a.name, type: a.type, TTL: a.TTL, data: a.data }; }) };
  } catch (e) {
    return { status: e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || 'error', answers: [] };
  }
}

// ---------------------------------------------------------------------
// Record parsers (best-effort; we don't do full RFC parsing)
// ---------------------------------------------------------------------
function parseSpf(records) {
  // SPF is a TXT record starting with "v=spf1".
  const txts = records.filter(function (r) { return typeof r.data === 'string' && r.data.replace(/^"|"$/g, '').toLowerCase().indexOf('v=spf1') === 0; });
  if (txts.length === 0) return { present: false };
  const raw = txts[0].data.replace(/^"|"$/g, '');
  // Count mechanisms to detect the "10 lookup max" RFC violation.
  const mechanisms = raw.split(/\s+/).slice(1); // skip v=spf1
  const all = mechanisms.filter(function (m) { return m === '-all' || m === '~all' || m === '?all' || m === '+all'; });
  const qualifier = all.length > 0 ? all[0] : null;
  const hasTooManyLookups = mechanisms.filter(function (m) { return /^(include|a|mx|ptr|exists|redirect):/i.test(m); }).length > 10;
  return {
    present: true,
    record: raw,
    qualifier: qualifier,
    mechanismCount: mechanisms.length,
    tooManyLookups: hasTooManyLookups,
  };
}

function parseDmarc(records) {
  const txts = records.filter(function (r) { return typeof r.data === 'string' && r.data.replace(/^"|"$/g, '').toLowerCase().indexOf('v=dmarc1') === 0; });
  if (txts.length === 0) return { present: false };
  const raw = txts[0].data.replace(/^"|"$/g, '');
  // Parse tags: p= (policy), rua= (aggregate report URIs), ruf= (forensic), sp= (subdomain policy), pct= (percentage), adkim= (DKIM alignment), aspf= (SPF alignment).
  const tags = {};
  raw.split(';').forEach(function (part) {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const k = part.slice(0, idx).trim().toLowerCase();
    const v = part.slice(idx + 1).trim();
    if (k) tags[k] = v;
  });
  return {
    present: true,
    record: raw,
    policy: (tags.p || 'none').toLowerCase(),
    subdomainPolicy: (tags.sp || tags.p || 'none').toLowerCase(),
    percentage: tags.pct ? parseInt(tags.pct, 10) : 100,
    reportingAggregate: tags.rua || null,
    reportingForensic: tags.ruf || null,
    alignmentDkim: (tags.adkim || 'r').toLowerCase(),
    alignmentSpf: (tags.aspf || 'r').toLowerCase(),
  };
}

function parseDkim(records) {
  const txts = records.filter(function (r) { return typeof r.data === 'string' && r.data.replace(/^"|"$/g, '').toLowerCase().indexOf('v=dkim1') === 0; });
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
  return {
    present: true,
    record: raw,
    keyType: tags.k || 'rsa',
    domain: tags.d || null,
  };
}

function parseBimi(records) {
  const txts = records.filter(function (r) { return typeof r.data === 'string' && r.data.replace(/^"|"$/g, '').toLowerCase().indexOf('v=bimi1') === 0; });
  if (txts.length === 0) return { present: false };
  const raw = txts[0].data.replace(/^"|"$/g, '');
  return { present: true, record: raw };
}

function parseMx(records) {
  if (records.length === 0) return { present: false, hosts: [] };
  return {
    present: true,
    hosts: records
      .map(function (r) {
        // MX rdata format: "<preference> <host>"
        const parts = String(r.data || '').split(/\s+/);
        return { preference: parseInt(parts[0], 10) || 0, host: parts.slice(1).join(' ') };
      })
      .sort(function (a, b) { return a.preference - b.preference; }),
  };
}

// ---------------------------------------------------------------------
// Composite score
//   Start 100.
//   -30  if no SPF
//   -15  if SPF exists but no -all (allows more than intended)
//   -10  if SPF uses too many lookups (RFC violation)
//   -25  if no DKIM on any tried selector
//   -25  if no DMARC
//   -15  if DMARC policy is "none" (not enforced)
//   -15  if no MX (can't receive mail)
// Risk:
//   >=80  Low
//   >=50  Medium
//   else  High
// ---------------------------------------------------------------------
function computeScore(spf, dkim, dmarc, mx) {
  let score = 100;
  const issues = [];
  const checks = [];

  if (!spf.present) {
    score -= 30;
    issues.push('No SPF record found at the apex.');
    checks.push({ id: 'spf', pass: false, value: null, message: 'No SPF record found at the apex.' });
  } else {
    if (!spf.qualifier || spf.qualifier !== '-all') {
      score -= 15;
      issues.push('SPF exists but does not end with -all. Other servers may spoof your domain.');
      checks.push({ id: 'spf_strict', pass: false, value: spf.qualifier, message: 'SPF ends with "' + (spf.qualifier || 'no qualifier') + '" instead of "-all".' });
    } else {
      checks.push({ id: 'spf_strict', pass: true, value: '-all', message: 'SPF ends with -all (strict).' });
    }
    if (spf.tooManyLookups) {
      score -= 10;
      issues.push('SPF uses more than 10 DNS lookups (RFC violation — some receivers will reject).');
      checks.push({ id: 'spf_lookups', pass: false, value: spf.mechanismCount, message: 'SPF triggers ' + spf.mechanismCount + ' DNS lookups (RFC max is 10).' });
    } else {
      checks.push({ id: 'spf_lookups', pass: true, value: spf.mechanismCount, message: 'SPF uses ' + spf.mechanismCount + ' mechanisms (within RFC limit).' });
    }
    checks.push({ id: 'spf', pass: true, value: 'v=spf1', message: 'SPF record found.' });
  }

  if (!dkim.present) {
    score -= 25;
    issues.push('No DKIM record found on any common selector.');
    checks.push({ id: 'dkim', pass: false, value: null, message: 'No DKIM record found on ' + DKIM_SELECTORS.length + ' common selectors.' });
  } else {
    checks.push({ id: 'dkim', pass: true, value: dkim.domain, message: 'DKIM found at ' + dkim.selector + '._domainkey.' + dkim.domain + '.' });
  }

  if (!dmarc.present) {
    score -= 25;
    issues.push('No DMARC record at _dmarc.');
    checks.push({ id: 'dmarc', pass: false, value: null, message: 'No DMARC record at _dmarc.' });
  } else {
    if (dmarc.policy === 'none') {
      score -= 15;
      issues.push('DMARC policy is "none" — receivers are not told to reject forged mail.');
      checks.push({ id: 'dmarc_policy', pass: false, value: 'none', message: 'DMARC policy is "none" (monitoring only).' });
    } else if (dmarc.policy === 'quarantine') {
      checks.push({ id: 'dmarc_policy', pass: true, value: 'quarantine', message: 'DMARC policy is "quarantine".' });
    } else if (dmarc.policy === 'reject') {
      checks.push({ id: 'dmarc_policy', pass: true, value: 'reject', message: 'DMARC policy is "reject" (strictest).' });
    } else {
      issues.push('DMARC policy is unrecognized: ' + dmarc.policy);
      checks.push({ id: 'dmarc_policy', pass: false, value: dmarc.policy, message: 'Unrecognized DMARC policy: "' + dmarc.policy + '".' });
    }
    checks.push({ id: 'dmarc', pass: true, value: 'v=DMARC1', message: 'DMARC record found.' });
  }

  if (!mx.present) {
    score -= 15;
    issues.push('No MX records — this domain cannot receive email.');
    checks.push({ id: 'mx', pass: false, value: null, message: 'No MX records found.' });
  } else {
    checks.push({ id: 'mx', pass: true, value: mx.hosts.length + ' host(s)', message: 'MX records found (' + mx.hosts.length + ').' });
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  let risk = 'unknown';
  if (score >= 80) risk = 'low';
  else if (score >= 50) risk = 'medium';
  else risk = 'high';

  return { score: score, risk: risk, issues: issues, checks: checks };
}

// ---------------------------------------------------------------------
// DKIM probe across common selectors. Returns the first hit.
// ---------------------------------------------------------------------
async function probeDkim(domain) {
  // Fan out all selectors in parallel. Each is a single DNS query.
  const results = await Promise.all(
    DKIM_SELECTORS.map(async function (sel) {
      const r = await doh(sel + '._domainkey.' + domain, 'TXT');
      return { selector: sel, records: r.answers };
    })
  );
  for (const r of results) {
    if (r.records.length > 0) {
      const parsed = parseDkim(r.records);
      if (parsed.present) return { ...parsed, selector: r.selector };
    }
  }
  return { present: false, probedSelectors: DKIM_SELECTORS, probedCount: DKIM_SELECTORS.length };
}

// ---------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------
export async function onRequestPost(context) { return handle(context); }
export async function onRequestGet(context)  { return handle(context); }
export async function onRequestOptions()     { return corsPreflight(); }

async function handle(context) {
  const start = Date.now();
  let domain = '';
  try {
    if (context.request.method === 'POST') {
      const body = await context.request.json().catch(() => ({}));
      domain = (body && body.domain) || '';
    } else {
      domain = new URL(context.request.url).searchParams.get('domain') || '';
    }
  } catch (_) {
    return jsonResponse({ error: 'invalid_request', message: 'Could not read request body.' }, 400);
  }

  // Normalize: strip protocol, www, path, lowercase.
  domain = (domain || '').trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  if (!isValidDomain(domain)) {
    return jsonResponse({ error: 'invalid_domain', message: 'Please provide a valid domain (e.g. example.com).' }, 400);
  }

  // Query the four core record types in parallel. DKIM and BIMI happen
  // after SPF/DMARC/MX resolve to keep the round-trip tight.
  const [spfRec, dmarcRec, mxRec] = await Promise.all([
    doh(domain, 'TXT'),
    doh('_dmarc.' + domain, 'TXT'),
    doh(domain, 'MX'),
  ]);
  const [dkim, bimi] = await Promise.all([
    probeDkim(domain),
    doh('default._bimi.' + domain, 'TXT').then(parseBimi),
  ]);

  const spf   = parseSpf(spfRec.answers);
  const dmarc = parseDmarc(dmarcRec.answers);
  const mx    = parseMx(mxRec.answers);
  const { score, risk, issues, checks } = computeScore(spf, dkim, dmarc, mx);

  return jsonResponse({
    domain,
    fetchedMs: Date.now() - start,
    score,
    risk,
    issues,
    checks,
    records: {
      spf:   { ...spf,   raw: spfRec.answers.map(function (a) { return a.data; }) },
      dkim,
      dmarc: { ...dmarc, raw: dmarcRec.answers.map(function (a) { return a.data; }) },
      mx,
      bimi,
    },
  });
}
