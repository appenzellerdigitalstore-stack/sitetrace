// =====================================================================
// SiteTrace — Free SEO Checker (Cloudflare Pages Function)
//
// Endpoint: POST /api/seo-check  (body: { url: "https://example.com" })
// Method:   also accepts GET ?url=https://example.com for easy testing
// Output:   { url, fetchedMs, score, counts, results: [...] }
//
// How to extend:
//   1. Add a new object to CHECKS below (id, weight, run)
//   2. The run() function receives the parsed `meta` object and the raw `html`
//   3. Return { pass: boolean, value: any, message: string }
//   4. Deploy. The page auto-renders the new check — no UI changes needed.
//
// All 12 checks in v1 are defined here. The check NAMES and MESSAGES are
// English-only (the UI labels pass/warn/fail are i18n'd separately in
// js/i18n.js). Translating check names is a future task — the function
// file is intentionally separate from the page UI so it stays focused.
// =====================================================================

// ---------------------------------------------------------------------
// HTML extractor — runs once per request, parses the raw HTML into
// a flat `meta` object that all checks read from.
// ---------------------------------------------------------------------
function extractMeta(html, requestedUrl) {
  const get = (re) => { const m = html.match(re); return m ? m[1].trim() : null; };
  const all = (re) => { const out = []; let m; while ((m = re.exec(html)) !== null) out.push(m); return out; };

  return {
    requestedUrl,
    title: get(/<title[^>]*>([\s\S]*?)<\/title>/i),
    description: get(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
                 || get(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)
                 || get(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']\s*\/?>/i),
    robots: get(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i)
            || get(/<meta\s+content=["']([^"']*)["']\s+name=["']robots["']/i),
    viewport: get(/<meta\s+name=["']viewport["']\s+content=["']([^"']*)["']/i)
              || get(/<meta\s+content=["']([^"']*)["']\s+name=["']viewport["']/i),
    canonical: get(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)
               || get(/<link\s+href=["']([^"']*)["']\s+rel=["']canonical["']/i),
    h1s: all(/<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean),
    h2s: all(/<h2[^>]*>([\s\S]*?)<\/h2>/gi).map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean),
    images: all(/<img\b[^>]*>/gi).map(m => {
      const src = (m.match(/\ssrc=["']([^"']*)["']/i) || [])[1] || '';
      const alt = (m.match(/\salt=["']([^"']*)["']/i) || [])[1];
      return { src, alt: alt === undefined ? null : (alt.trim() || null) };
    }),
    og: {
      title: get(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i),
      description: get(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i),
      image: get(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i),
    },
    twitter: {
      card: get(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']*)["']/i),
      title: get(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']*)["']/i),
    },
    textContent: html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

// ---------------------------------------------------------------------
// The 12 SEO checks. Each one is self-contained.
// Total weight = 100. To add a check, append an object below.
// ---------------------------------------------------------------------
const CHECKS = [
  {
    id: 'title',
    weight: 12,
    run: ({ title }) => {
      if (!title) return { pass: false, value: null, message: 'No <title> tag found.' };
      if (title.length < 30) return { pass: false, value: title, message: `Title is ${title.length} chars — aim for 30–60.` };
      if (title.length > 60) return { pass: false, value: title, message: `Title is ${title.length} chars — Google typically truncates at ~60.` };
      return { pass: true, value: title, message: `Title is ${title.length} chars.` };
    },
  },
  {
    id: 'meta_description',
    weight: 10,
    run: ({ description }) => {
      if (!description) return { pass: false, value: null, message: 'No meta description found.' };
      if (description.length < 70) return { pass: false, value: description, message: `Meta description is ${description.length} chars — aim for 70–160.` };
      if (description.length > 160) return { pass: false, value: description, message: `Meta description is ${description.length} chars — Google typically truncates at ~160.` };
      return { pass: true, value: description, message: `Meta description is ${description.length} chars.` };
    },
  },
  {
    id: 'h1',
    weight: 10,
    run: ({ h1s }) => {
      if (h1s.length === 0) return { pass: false, value: null, message: 'No <h1> tag on the page.' };
      if (h1s.length > 1) return { pass: false, value: h1s, message: `Found ${h1s.length} <h1> tags — use exactly one.` };
      return { pass: true, value: h1s[0], message: `One <h1>: “${h1s[0].slice(0, 60)}${h1s[0].length > 60 ? '…' : ''}”` };
    },
  },
  {
    id: 'h2',
    weight: 5,
    run: ({ h2s }) => {
      if (h2s.length === 0) return { pass: false, value: 0, message: 'No <h2> tags — long-form pages benefit from subheadings.' };
      return { pass: true, value: h2s.length, message: `${h2s.length} <h2> tag${h2s.length === 1 ? '' : 's'}.` };
    },
  },
  {
    id: 'canonical',
    weight: 5,
    run: ({ canonical, requestedUrl }) => {
      if (!canonical) return { pass: false, value: null, message: 'No canonical URL set.' };
      try {
        const a = new URL(canonical);
        const b = new URL(requestedUrl);
        const ok = a.host === b.host && (a.pathname === b.pathname || a.pathname === b.pathname.replace(/\/$/, ''));
        return ok
          ? { pass: true, value: canonical, message: `Canonical matches: ${canonical}` }
          : { pass: false, value: canonical, message: `Canonical points elsewhere: ${canonical}` };
      } catch (_) {
        return { pass: false, value: canonical, message: `Canonical is malformed: ${canonical}` };
      }
    },
  },
  {
    id: 'robots',
    weight: 5,
    run: ({ robots }) => {
      if (!robots) return { pass: true, value: null, message: 'No meta robots — defaults to index, follow.' };
      const r = robots.toLowerCase();
      if (r.includes('noindex')) return { pass: false, value: robots, message: `Page is set to noindex: "${robots}"` };
      return { pass: true, value: robots, message: `Meta robots: "${robots}"` };
    },
  },
  {
    id: 'viewport',
    weight: 4,
    run: ({ viewport }) => {
      if (!viewport) return { pass: false, value: null, message: 'No viewport meta tag — page is not mobile-friendly.' };
      return { pass: true, value: viewport, message: 'Viewport meta present.' };
    },
  },
  {
    id: 'og',
    weight: 8,
    run: ({ og }) => {
      const missing = [];
      if (!og.title) missing.push('og:title');
      if (!og.description) missing.push('og:description');
      if (!og.image) missing.push('og:image');
      if (missing.length === 0) return { pass: true, value: og, message: 'Open Graph complete.' };
      if (missing.length === 3) return { pass: false, value: og, message: 'No Open Graph tags — social shares will look plain.' };
      return { pass: false, value: og, message: `Open Graph missing: ${missing.join(', ')}` };
    },
  },
  {
    id: 'twitter',
    weight: 5,
    run: ({ twitter }) => {
      const missing = [];
      if (!twitter.card) missing.push('twitter:card');
      if (!twitter.title) missing.push('twitter:title');
      if (missing.length === 0) return { pass: true, value: twitter, message: 'Twitter Card complete.' };
      return { pass: false, value: twitter, message: `Twitter Card missing: ${missing.join(', ')}` };
    },
  },
  {
    id: 'alt_text',
    weight: 8,
    run: ({ images }) => {
      if (images.length === 0) return { pass: true, value: { total: 0, withAlt: 0 }, message: 'No <img> tags on the page.' };
      const withAlt = images.filter(i => i.alt !== null).length;
      const ratio = withAlt / images.length;
      if (ratio >= 0.8) return { pass: true, value: { total: images.length, withAlt }, message: `${withAlt}/${images.length} images have alt text.` };
      if (ratio >= 0.5) return { pass: false, value: { total: images.length, withAlt }, message: `${images.length - withAlt} of ${images.length} images missing alt text (${Math.round(ratio * 100)}% covered).` };
      return { pass: false, value: { total: images.length, withAlt }, message: `Only ${withAlt} of ${images.length} images have alt text — accessibility issue.` };
    },
  },
  {
    id: 'https',
    weight: 8,
    run: ({ requestedUrl }) => {
      try {
        const u = new URL(requestedUrl);
        if (u.protocol === 'https:') return { pass: true, value: 'https', message: 'Page is served over HTTPS.' };
        return { pass: false, value: u.protocol.replace(':', ''), message: `Page is served over ${u.protocol.toUpperCase()} — switch to HTTPS.` };
      } catch (_) {
        return { pass: false, value: null, message: 'Invalid URL.' };
      }
    },
  },
  {
    id: 'word_count',
    weight: 10,
    run: ({ textContent }) => {
      const words = (textContent.match(/\S+/g) || []).length;
      if (words < 100) return { pass: false, value: words, message: `Only ${words} words on the page — thin content.` };
      if (words < 300) return { pass: false, value: words, message: `${words} words — aim for 300+ for ranking.` };
      if (words < 1500) return { pass: true, value: words, message: `${words} words.` };
      return { pass: true, value: words, message: `${words} words — comprehensive.` };
    },
  },
];

// Sanity check: weights must add to 100.
const totalWeight = CHECKS.reduce((s, c) => s + c.weight, 0);
if (totalWeight !== 100) {
  console.error('CHECKS weights sum to ' + totalWeight + ', expected 100. Adjust weights so the total is 100.');
}

// ---------------------------------------------------------------------
// SSRF guard — block requests to private IPs, localhost, etc.
// (Cloudflare Workers blocks most of these by default at the fetch() level,
// but we validate the input URL too so we fail fast and clearly.)
// ---------------------------------------------------------------------
function isBlockedUrl(input) {
  let u;
  try { u = new URL(input); } catch { return 'Invalid URL.'; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Only http:// and https:// URLs are allowed.';
  const host = u.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return 'Localhost is not allowed.';
  if (host.endsWith('.local') || host.endsWith('.internal')) return 'Internal hostnames are not allowed.';
  // Crude private-IP check for the literal hostname (DNS resolution happens
  // at fetch time, and Cloudflare Workers blocks private IPs by default).
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(host)) return 'Private IP addresses are not allowed.';
  return null;
}

// ---------------------------------------------------------------------
// Handler — POST/GET, returns JSON
// ---------------------------------------------------------------------
export async function onRequestPost(context) {
  return handle(context);
}
export async function onRequestGet(context) {
  return handle(context);
}

async function handle(context) {
  const start = Date.now();
  let url;
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

  // Fetch the target with a hard size + time cap.
  let resp;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    resp = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'SiteTrace-SEO-Checker/1.0 (+https://sitetrace.it.com/seo-checker/)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(t);
  } catch (e) {
    return jsonResponse({ error: 'unreachable', message: 'The page could not be reached (timeout, DNS, or network error).' }, 502);
  }

  if (!resp.ok) {
    return jsonResponse({ error: 'unreachable', message: `Target returned HTTP ${resp.status}.` }, 502);
  }

  // Limit body to 2 MB to keep memory and response time bounded.
  const contentLength = parseInt(resp.headers.get('content-length') || '0', 10);
  if (contentLength > 2 * 1024 * 1024) {
    return jsonResponse({ error: 'too_large', message: 'The page response was over 2 MB.' }, 413);
  }
  const buf = await resp.arrayBuffer();
  if (buf.byteLength > 2 * 1024 * 1024) {
    return jsonResponse({ error: 'too_large', message: 'The page response was over 2 MB.' }, 413);
  }
  const html = new TextDecoder('utf-8').decode(buf);

  // Parse + run all checks.
  const meta = extractMeta(html, url);
  const results = CHECKS.map(c => ({
    id: c.id,
    pass: null, // set below
    value: null,
    message: '',
    weight: c.weight,
  }));
  let earned = 0;
  for (let i = 0; i < CHECKS.length; i++) {
    const c = CHECKS[i];
    let out;
    try { out = c.run({ ...meta, html }); } catch (e) { out = { pass: false, value: null, message: 'Check error: ' + (e && e.message) }; }
    results[i].pass = !!out.pass;
    results[i].value = out.value;
    results[i].message = out.message;
    if (out.pass) earned += c.weight;
  }

  const passing = results.filter(r => r.pass).length;
  const warnings = results.filter(r => r.pass === false).length;

  return jsonResponse({
    url,
    fetchedMs: Date.now() - start,
    score: earned,
    total: totalWeight,
    counts: { passing, warnings, total: results.length },
    results,
  });
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}

// Handle CORS preflight cheaply.
export async function onRequestOptions() {
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
