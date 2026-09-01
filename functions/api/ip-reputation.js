// =====================================================================
// SiteTrace — Free IP Reputation Check (Cloudflare Pages Function)
//
// Endpoint: POST /api/ip-reputation  (body: { ip: "1.2.3.4" })
//           GET  /api/ip-reputation?ip=1.2.3.4
//           If no IP is provided, checks the requester's IP
//           (Cloudflare-Connecting-IP header).
//
// What it does:
//   1. Reverse the IPv4 and query 7 public DNSBLs in parallel via
//      Cloudflare DNS-over-HTTPS (Spamhaus ZEN, Spamcop, Barracuda,
//      CBL Abuseat, SORBS, UCEPROTECT L1, PSBL Surriel).
//   2. Query ip-api.com (free tier) for geolocation + proxy/hosting
//      /mobile detection in parallel.
//   3. Compute a 0–100 reputation score and a Low/Medium/High risk
//      label from the combined signals.
//   4. Return JSON with the per-blacklist status, the score, the
//      risk, and the geo data.
//
// Notes:
//   - All DNSBLs queried here are public and free to use for low
//     volume. Spamhaus specifically allows up to 100k queries/day
//     from any single source IP for non-commercial use.
//   - Caching: 5 min at the edge. Reputation can shift quickly when
//     a listing changes, so don't cache longer.
//   - If the request omits `ip`, we fall back to CF-Connecting-IP
//     (Cloudflare injects the real client IP at the edge) so the
//     page can do a "check my own IP" without a separate endpoint.
// =====================================================================

// ---------------------------------------------------------------------
// DNSBL zones — public, free for low-volume use. Order is for display
// only (most-listed first when the user looks at the table).
// ---------------------------------------------------------------------
const DNSBLS = [
  { id: 'spamhaus_zen',   zone: 'zen.spamhaus.org',          label: 'Spamhaus ZEN' },
  { id: 'spamcop',        zone: 'bl.spamcop.net',            label: 'Spamcop' },
  { id: 'barracuda',      zone: 'b.barracudacentral.org',    label: 'Barracuda' },
  { id: 'cbl',            zone: 'cbl.abuseat.org',           label: 'CBL Abuseat' },
  { id: 'sorbs',          zone: 'dnsbl.sorbs.net',           label: 'SORBS' },
  { id: 'uceprotect_l1',  zone: 'uceprotectl1.dnsbl.org',    label: 'UCEPROTECT L1' },
  { id: 'psbl',           zone: 'psbl.surriel.com',          label: 'PSBL Surriel' },
];

const DOH = 'https://cloudflare-dns.com/dns-query';
const GEO_API = 'http://ip-api.com/json';
const TIMEOUT_MS = 6000;

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
      // 5-min edge cache. Reputation data is volatile enough that we
      // don't want to cache for longer.
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

// ---------------------------------------------------------------------
// DNSBL query — single zone. Returns { listed: bool|null, codes: [], error }
//   listed=true   => 127.0.0.x (x>0) answer present
//   listed=false  => NOERROR with no 127.0.0.x answer, or NXDOMAIN (3)
//   listed=null   => query failed (network, timeout, SERVFAIL, etc.)
// ---------------------------------------------------------------------
async function queryDnsbl(ip, zone) {
  const host = `${reverseIp(ip)}.${zone}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const resp = await fetch(
      `${DOH}?name=${encodeURIComponent(host)}&type=A`,
      { headers: { 'Accept': 'application/dns-json' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!resp.ok) return { listed: null, codes: [], error: `http_${resp.status}` };
    const data = await resp.json();
    // Status 3 = NXDOMAIN = not listed. Status 0 = NOERROR — check Answer.
    if (data.Status === 3) return { listed: false, codes: [], error: null };
    if (data.Status !== 0) return { listed: null, codes: [], error: `dns_status_${data.Status}` };
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    // Different 127.0.0.x codes mean different reasons (e.g. 2 = spam
    // source, 4 = open proxy, 5 = trojan). We surface them so the
    // user can see *why* a list flagged the IP.
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

async function queryAllDnsbls(ip) {
  return await Promise.all(
    DNSBLS.map(async (d) => {
      const r = await queryDnsbl(ip, d.zone);
      return { id: d.id, label: d.label, listed: r.listed, codes: r.codes, error: r.error };
    })
  );
}

// ---------------------------------------------------------------------
// Geolocation + connection type. ip-api.com free tier is HTTP only
// (paid plans add HTTPS), but the data returned is the IP being
// queried and its public geo info — not credentials or PII.
// ---------------------------------------------------------------------
async function queryGeo(ip) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const resp = await fetch(
      `${GEO_API}/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile,query`,
      { signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.status !== 'success') return null;
    return data;
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------
// Composite score 0–100. Higher = cleaner reputation.
//   -10 per DNSBL hit
//   -15 if the IP is flagged as a proxy
//   -5  if the IP is hosting (data-center) — not necessarily bad, but
//        indicates a server, not a real user, which inflates spam risk
//   +5  if the IP is a mobile carrier (typically residential and
//        less likely to be on blocklists for legitimate users)
//   floor 0, ceiling 100
//   risk: >=80 low, >=50 medium, <50 high
// ---------------------------------------------------------------------
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
  else risk = 'high';

  return { score, risk, listedCount, checkedCount };
}

// ---------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------
export async function onRequestPost(context) { return handle(context); }
export async function onRequestGet(context)  { return handle(context); }
export async function onRequestOptions()     { return corsPreflight(); }

async function handle(context) {
  const start = Date.now();
  let ip = '';
  try {
    if (context.request.method === 'POST') {
      const body = await context.request.json().catch(() => ({}));
      ip = (body && body.ip) || '';
    } else {
      ip = new URL(context.request.url).searchParams.get('ip') || '';
    }
  } catch (_) {
    return jsonResponse({ error: 'invalid_request', message: 'Could not read request body.' }, 400);
  }

  ip = (ip || '').trim();
  if (!ip) {
    // Fallback to the requester's own IP, injected by Cloudflare.
    ip = context.request.headers.get('CF-Connecting-IP') || '';
  }
  if (!isValidIPv4(ip)) {
    return jsonResponse({ error: 'invalid_ip', message: 'Please provide a valid IPv4 address.' }, 400);
  }

  const [dnsbl, geo] = await Promise.all([queryAllDnsbls(ip), queryGeo(ip)]);
  const { score, risk, listedCount, checkedCount } = computeScore(dnsbl, geo);

  return jsonResponse({
    ip,
    fetchedMs: Date.now() - start,
    score,
    risk,
    dnsbl: {
      checked: checkedCount,
      listed: listedCount,
      total: DNSBLS.length,
      results: dnsbl,
    },
    geo: geo || null,
  });
}
