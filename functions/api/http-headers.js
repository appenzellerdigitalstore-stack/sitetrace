// =====================================================================
// SiteTrace — Free HTTP Headers Viewer (Cloudflare Pages Function)
//
// Endpoint: POST /api/http-headers  (body: { url: "https://example.com" })
//           GET  /api/http-headers?url=https://example.com
//
// What it does:
//   1. Fetches the URL with a hard 12-second timeout and 2 MB body cap
//      (we only need the headers, but cap the body defensively in case
//      a server sends a Content-Length > 0 before headers flush).
//   2. Parses the response headers into a flat object.
//   3. Runs a security-header analysis: checks for the seven headers
//      that matter (CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
//      Referrer-Policy, Permissions-Policy, X-XSS-Protection), flags
//      info leaks (Server, X-Powered-By), and computes an A+/A/B/C/D/F
//      grade.
//   4. Returns JSON for the page to render.
//
// SSRF guard: block private IPs, localhost, .local/.internal, etc.
// Cloudflare Workers also block most of these at the fetch() level.
// =====================================================================

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      // 5-min edge cache. Headers for a given URL rarely change.
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

// Security-header scoring. Each header is worth N points; missing it
// loses the points. Weights sum to 100.
const SECURITY_CHECKS = [
  { id: 'csp',                 header: 'content-security-policy',     weight: 25, label: 'Content-Security-Policy',      why: 'Prevents XSS by restricting what the page can load and execute.' },
  { id: 'hsts',                header: 'strict-transport-security',   weight: 20, label: 'Strict-Transport-Security',    why: 'Forces HTTPS for the domain, preventing downgrade attacks.' },
  { id: 'x_frame_options',     header: 'x-frame-options',             weight: 15, label: 'X-Frame-Options',              why: 'Stops clickjacking by preventing the page from being framed.' },
  { id: 'x_content_type_options', header: 'x-content-type-options',   weight: 10, label: 'X-Content-Type-Options',       why: 'Stops MIME-sniffing attacks.' },
  { id: 'referrer_policy',     header: 'referrer-policy',             weight: 10, label: 'Referrer-Policy',              why: 'Controls how much URL info leaks to other sites via Referer.' },
  { id: 'permissions_policy',   header: 'permissions-policy',           weight: 10, label: 'Permissions-Policy',           why: 'Disables powerful browser features (camera, mic, geolocation) the page does not need.' },
  { id: 'xss_protection',      header: 'x-xss-protection',            weight: 0,  label: 'X-XSS-Protection',             why: 'Legacy; most modern browsers ignore it. Required only for very old IE/Chrome.' },
];

// Info-leak checks (not part of the grade, but flagged in the output).
const INFO_LEAK_HEADERS = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version'];

function gradeFor(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function analyze(headersObj) {
  const out = { checks: [], infoLeaks: [], score: 0, grade: 'F', total: 0, present: 0 };
  for (const c of SECURITY_CHECKS) {
    const v = headersObj[c.header];
    const present = !!(v && String(v).trim().length > 0);
    const pass = present && (c.id !== 'xss_protection' || /1\s*;\s*mode=block/i.test(String(v)) || /1\s*;\s*report=/i.test(String(v)));
    if (present) out.present += 1;
    out.total += 1;
    out.checks.push({
      id: c.id,
      label: c.label,
      header: c.header,
      present: present,
      pass: c.id === 'xss_protection' ? pass : present,
      value: v || null,
      why: c.why,
      weight: c.weight,
    });
    if (c.weight > 0) {
      // X-XSS-Protection only counts if it's set to 1; mode=block; or report=
      if (pass) out.score += c.weight;
    }
  }
  // Cap and grade.
  if (out.score > 100) out.score = 100;
  out.grade = gradeFor(out.score);
  // Info leaks
  for (const h of INFO_LEAK_HEADERS) {
    if (headersObj[h] && String(headersObj[h]).trim().length) {
      out.infoLeaks.push({ header: h, value: String(headersObj[h]) });
    }
  }
  return out;
}

export async function onRequestPost(context) { return handle(context); }
export async function onRequestGet(context)  { return handle(context); }
export async function onRequestOptions()     { return corsPreflight(); }

async function handle(context) {
  const start = Date.now();
  let url = '';
  try {
    if (context.request.method === 'POST') {
      const body = await context.request.json().catch(() => ({}));
      url = (body && body.url) || '';
    } else {
      url = new URL(context.request.url).searchParams.get('url') || '';
    }
  } catch (_) {
    return jsonResponse({ error: 'invalid_request', message: 'Could not read request body.' }, 400);
  }
  url = (url || '').trim();
  if (!url) return jsonResponse({ error: 'invalid_url', message: 'Please provide a URL.' }, 400);
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const blockReason = isBlockedUrl(url);
  if (blockReason) return jsonResponse({ error: 'blocked_url', message: blockReason }, 400);

  // Fetch the target.
  let resp;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    resp = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'SiteTrace-HTTP-Headers/1.0 (+https://sitetrace.it.com/http-headers/)',
        'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(t);
  } catch (e) {
    return jsonResponse({ error: 'unreachable', message: 'The URL could not be reached (timeout, DNS, or network error).' }, 502);
  }

  // Convert headers to a flat lowercase object. Headers may have multiple
  // values (e.g. Set-Cookie); we keep the first.
  const headersObj = {};
  resp.headers.forEach(function (value, key) {
    const k = key.toLowerCase();
    if (!(k in headersObj)) headersObj[k] = value;
  });

  // Consume (and discard) the body to free the connection, but cap
  // it at 2 MB to prevent memory blowup on huge responses.
  try {
    const reader = resp.body.getReader();
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += (value && value.byteLength) || 0;
      if (received > 2 * 1024 * 1024) { try { await reader.cancel(); } catch (_) {}; break; }
    }
  } catch (_) { /* body is fine to ignore */ }

  const analysis = analyze(headersObj);
  const finalUrl = resp.url || url;
  return jsonResponse({
    inputUrl: url,
    finalUrl: finalUrl,
    redirected: finalUrl !== url,
    status: resp.status,
    statusText: resp.statusText,
    fetchedMs: Date.now() - start,
    httpVersion: 'HTTP/' + (resp.headers.get('x-http-version') || (resp.headers.get('alt-svc') ? '2' : '1.1')), // best effort
    score: analysis.score,
    grade: analysis.grade,
    present: analysis.present,
    total: analysis.total,
    checks: analysis.checks,
    infoLeaks: analysis.infoLeaks,
    headers: headersObj,
  });
}
