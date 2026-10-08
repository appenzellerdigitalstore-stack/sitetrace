// Server-side diagnostic tools. These run as TanStack Start server
// functions (compiled into _worker.js) and are called from the client
// via createServerFn. They replace the functions/api/*.js Cloudflare
// Pages Functions that worked before the TanStack Start migration
// (Pages Functions are ignored when _worker.js is present).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DOH = "https://cloudflare-dns.com/dns-query";
const GEO_API = "http://ip-api.com/json";
const TIMEOUT_MS = 6000;

const DNSBLS: Array<{ id: string; zone: string; label: string }> = [
  { id: "spamhaus_zen", zone: "zen.spamhaus.org", label: "Spamhaus ZEN" },
  { id: "spamcop", zone: "bl.spamcop.net", label: "Spamcop" },
  { id: "barracuda", zone: "b.barracudacentral.org", label: "Barracuda" },
  { id: "cbl", zone: "cbl.abuseat.org", label: "CBL Abuseat" },
  { id: "sorbs", zone: "dnsbl.sorbs.net", label: "SORBS" },
  { id: "uceprotect_l1", zone: "uceprotectl1.dnsbl.org", label: "UCEPROTECT L1" },
  { id: "psbl", zone: "psbl.surriel.com", label: "PSBL Surriel" },
];

const PRESENCE_HEADERS: Array<{ id: string; name: string; weight: number }> = [
  { id: "strict-transport-security", name: "Strict-Transport-Security", weight: 15 },
  { id: "content-security-policy", name: "Content-Security-Policy", weight: 25 },
  { id: "x-frame-options", name: "X-Frame-Options", weight: 10 },
  { id: "x-content-type-options", name: "X-Content-Type-Options", weight: 10 },
  { id: "referrer-policy", name: "Referrer-Policy", weight: 10 },
  { id: "permissions-policy", name: "Permissions-Policy", weight: 15 },
  { id: "x-xss-protection", name: "X-XSS-Protection", weight: 5 },
];

const INFO_LEAK_HEADERS = ["server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version"];

const SECURITY_GRADES: Array<[number, string]> = [
  [95, "A+"], [85, "A"], [70, "B"], [55, "C"], [40, "D"], [0, "F"],
];

const SEO_CHECKS: Array<{ id: string; weight: number; run: (data: { html: string; title: string; description: string; canonical: string; robots: string; h1: string; lang: string; images: number; imagesWithoutAlt: number; wordCount: number }) => { pass: boolean; value: unknown; message: string } }> = [
  { id: "title", weight: 15, run: ({ title }) => {
    if (!title) return { pass: false, value: null, message: "Missing <title> tag." };
    if (title.length < 30) return { pass: false, value: title.length, message: `Title is only ${title.length} characters (aim for 50–60).` };
    if (title.length > 65) return { pass: false, value: title.length, message: `Title is ${title.length} characters (over 65, may be truncated in search).` };
    return { pass: true, value: title.length, message: `${title.length} characters.` };
  } },
  { id: "meta_description", weight: 15, run: ({ description }) => {
    if (!description) return { pass: false, value: null, message: "Missing meta description." };
    if (description.length < 70) return { pass: false, value: description.length, message: `Meta description is ${description.length} characters (aim for 120–155).` };
    if (description.length > 160) return { pass: false, value: description.length, message: `Meta description is ${description.length} characters (over 160, may be truncated).` };
    return { pass: true, value: description.length, message: `${description.length} characters.` };
  } },
  { id: "canonical", weight: 10, run: ({ canonical }) => canonical ? { pass: true, value: canonical, message: canonical } : { pass: false, value: null, message: "No canonical URL." } },
  { id: "h1", weight: 10, run: ({ h1 }) => h1 ? { pass: true, value: h1, message: h1 } : { pass: false, value: null, message: "Missing <h1> heading." } },
  { id: "robots", weight: 10, run: ({ robots }) => robots ? { pass: true, value: robots, message: robots } : { pass: false, value: null, message: "No meta robots tag." } },
  { id: "lang", weight: 5, run: ({ lang }) => lang ? { pass: true, value: lang, message: lang } : { pass: false, value: null, message: "No <html lang> attribute." } },
  { id: "images_alt", weight: 15, run: ({ images, imagesWithoutAlt }) => {
    if (images === 0) return { pass: true, value: 0, message: "No images to check." };
    if (imagesWithoutAlt > 0) return { pass: false, value: `${imagesWithoutAlt}/${images}`, message: `${imagesWithoutAlt} of ${images} images missing alt text.` };
    return { pass: true, value: images, message: `All ${images} images have alt text.` };
  } },
  { id: "word_count", weight: 20, run: ({ wordCount }) => {
    if (wordCount < 300) return { pass: false, value: wordCount, message: `${wordCount} words — aim for 300+ for ranking.` };
    if (wordCount < 1500) return { pass: true, value: wordCount, message: `${wordCount} words.` };
    return { pass: true, value: wordCount, message: `${wordCount} words — comprehensive.` };
  } },
];

// ----- shared helpers -----

async function doh(name: string, type: number): Promise<Array<{ name: string; type: number; TTL: number; data: string }>> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, { signal: ctrl.signal, headers: { Accept: "application/dns-json" } });
    if (!r.ok) return [];
    const data = await r.json() as { Answer?: Array<{ name: string; type: number; TTL: number; data: string }> };
    return data.Answer ?? [];
  } catch { return []; } finally { clearTimeout(t); }
}

function isValidIPv4(s: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return false;
  return s.split(".").every(n => Number(n) <= 255);
}

function gradeFor(score: number): string {
  for (const [threshold, grade] of SECURITY_GRADES) if (score >= threshold) return grade;
  return "F";
}

function isBlockedUrl(input: string): string | null {
  let u: URL;
  try { u = new URL(input); } catch { return "Invalid URL."; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return "Only http:// and https:// URLs are allowed.";
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0") return "Localhost is not allowed.";
  if (host.endsWith(".local") || host.endsWith(".internal")) return "Internal hostnames are not allowed.";
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(host)) return "Private IP addresses are not allowed.";
  return null;
}

// =====================================================================
// IP reputation (7 DNSBLs + geo + score)
// =====================================================================

async function queryDnsbl(ip: string, zone: string): Promise<{ listed: boolean; codes: string[]; error: string | null }> {
  const reversed = ip.split(".").reverse().join(".");
  const answers = await doh(`${reversed}.${zone}`, 1);
  const codes = answers.map(a => a.data).filter(d => d.startsWith("127.0.0.")).map(d => d.split(".").pop() ?? "").filter(c => c !== "0");
  return { listed: codes.length > 0, codes, error: null };
}

async function queryAllDnsbls(ip: string) {
  return Promise.all(DNSBLS.map(async (d) => {
    const r = await queryDnsbl(ip, d.zone);
    return { id: d.id, label: d.label, listed: r.listed, codes: r.codes, error: r.error };
  }));
}

async function queryGeo(ip: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(`${GEO_API}/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile,query`, { signal: ctrl.signal });
    if (!resp.ok) return null;
    const data = await resp.json() as { status?: string };
    if (data.status !== "success") return null;
    return data as Record<string, unknown>;
  } catch { return null; } finally { clearTimeout(t); }
}

function computeReputationScore(dnsbl: Array<{ listed: boolean | null }>, geo: Record<string, unknown> | null) {
  let score = 100;
  let listed = 0, checked = 0;
  for (const d of dnsbl) {
    if (d.listed === true) { listed += 1; score -= 10; }
    else if (d.listed === false) { checked += 1; }
  }
  if (geo) {
    if (geo.proxy === true) score -= 15;
    if (geo.hosting === true) score -= 5;
    if (geo.mobile === true) score += 5;
  }
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  let risk: string;
  if (score >= 80) risk = "low";
  else if (score >= 50) risk = "medium";
  else risk = "high";
  return { score, risk, listed, checked };
}

export const checkIpReputation = createServerFn({ method: "GET" })
  .validator(z.object({ ip: z.string() }))
  .handler(async ({ data }) => {
    const ip = (data.ip || "").trim();
    if (!isValidIPv4(ip)) {
      return { error: "invalid_ip", message: "Please provide a valid IPv4 address." };
    }
    const start = Date.now();
    const [dnsbl, geo] = await Promise.all([queryAllDnsbls(ip), queryGeo(ip)]);
    const { score, risk, listed, checked } = computeReputationScore(dnsbl, geo);
    return {
      ip,
      fetchedMs: Date.now() - start,
      score,
      risk,
      dnsbl: { checked, listed, total: DNSBLS.length, results: dnsbl },
      geo: geo ?? null,
    };
  });

// =====================================================================
// HTTP headers + security analysis
// =====================================================================

function analyzeSecurityHeaders(headers: Record<string, string>) {
  let score = 0;
  const checks: Array<{ id: string; name: string; present: boolean; value: string; recommendation: string; weight: number }> = [];
  const infoLeaks: Array<{ header: string; value: string }> = [];
  for (const h of PRESENCE_HEADERS) {
    const v = headers[h.id];
    const present = typeof v === "string" && v.length > 0;
    if (present) score += h.weight;
    checks.push({
      id: h.id, name: h.name, present,
      value: present ? (v as string) : "",
      recommendation: present ? "" : h.id === "content-security-policy" ? "Define a CSP that restricts script-src, style-src, and other content sources." : h.id === "strict-transport-security" ? "Set Strict-Transport-Security: max-age=31536000; includeSubDomains." : h.id === "x-frame-options" ? "Set X-Frame-Options: DENY (or use CSP frame-ancestors)." : h.id === "x-content-type-options" ? "Set X-Content-Type-Options: nosniff." : h.id === "referrer-policy" ? "Set Referrer-Policy: strict-origin-when-cross-origin." : h.id === "permissions-policy" ? "Restrict unused browser features (camera, microphone, geolocation, etc.)." : "Set X-XSS-Protection: 1; mode=block (legacy browsers).",
      weight: h.weight,
    });
  }
  if (score > 100) score = 100;
  for (const h of INFO_LEAK_HEADERS) {
    const v = headers[h];
    if (v && String(v).trim().length) infoLeaks.push({ header: h, value: String(v) });
  }
  return { score, grade: gradeFor(score), present: checks.filter(c => c.present).length, total: checks.length, checks, infoLeaks };
}

export const checkHttpHeaders = createServerFn({ method: "GET" })
  .validator(z.object({ url: z.string(), method: z.enum(["GET", "HEAD"]).optional() }))
  .handler(async ({ data }) => {
    let url = (data.url || "").trim();
    if (!url) return { error: "invalid_url", message: "Please provide a URL." };
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const blockReason = isBlockedUrl(url);
    if (blockReason) return { error: "blocked_url", message: blockReason };
    const start = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    let resp: Response;
    try {
      resp = await fetch(url, { method: data.method ?? "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "SiteTrace-HTTP-Headers/1.0", Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8" } });
    } catch {
      return { error: "unreachable", message: "The URL could not be reached (timeout, DNS, or network error)." };
    } finally { clearTimeout(t); }
    const headers: Record<string, string> = {};
    resp.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (!(k in headers)) headers[k] = value;
    });
    try {
      const reader = resp.body?.getReader();
      if (reader) {
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          received += (value && value.byteLength) || 0;
          if (received > 2 * 1024 * 1024) { try { await reader.cancel(); } catch { /* ignore */ } break; }
        }
      }
    } catch { /* body is fine to ignore */ }
    const analysis = analyzeSecurityHeaders(headers);
    return {
      inputUrl: url,
      finalUrl: resp.url || url,
      redirected: (resp.url || url) !== url,
      status: resp.status,
      statusText: resp.statusText,
      fetchedMs: Date.now() - start,
      httpVersion: "HTTP/" + (resp.headers.get("x-http-version") || (resp.headers.get("alt-svc") ? "2" : "1.1")),
      score: analysis.score,
      grade: analysis.grade,
      present: analysis.present,
      total: analysis.total,
      checks: analysis.checks,
      infoLeaks: analysis.infoLeaks,
      headers,
    };
  });

// =====================================================================
// SEO checker
// =====================================================================

function extractMeta(html: string, url: string) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
  const description = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
  const canonical = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
  const robots = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
  const lang = html.match(/<html\s+[^>]*lang=["']([^"']+)["']/i)?.[1]?.trim() ?? "";
  const imgMatches = Array.from(html.matchAll(/<img\s+[^>]*>/gi));
  const images = imgMatches.length;
  const imagesWithoutAlt = imgMatches.filter(tag => !/\salt\s*=/.test(tag[0])).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  void url;
  return { title, description, canonical, robots, h1, lang, images, imagesWithoutAlt, wordCount };
}

export const checkSeo = createServerFn({ method: "GET" })
  .validator(z.object({ url: z.string() }))
  .handler(async ({ data }) => {
    let url = (data.url || "").trim();
    if (!url) return { error: "invalid_url", message: "Please provide a URL." };
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const blockReason = isBlockedUrl(url);
    if (blockReason) return { error: "blocked_url", message: blockReason };
    const start = Date.now();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    let resp: Response;
    try {
      resp = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "SiteTrace-SEO-Checker/1.0", Accept: "text/html,application/xhtml+xml" } });
    } catch {
      return { error: "unreachable", message: "The page could not be reached." };
    } finally { clearTimeout(t); }
    if (!resp.ok) return { error: "unreachable", message: `Target returned HTTP ${resp.status}.` };
    const contentLength = parseInt(resp.headers.get("content-length") || "0", 10);
    if (contentLength > 2 * 1024 * 1024) return { error: "too_large", message: "The page response was over 2 MB." };
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > 2 * 1024 * 1024) return { error: "too_large", message: "The page response was over 2 MB." };
    const html = new TextDecoder("utf-8").decode(buf);
    const meta = extractMeta(html, url);
    const results: Array<{ id: string; pass: boolean | null; value: unknown; message: string; weight: number }> = [];
    let earned = 0;
    for (const c of SEO_CHECKS) {
      let out;
      try { out = c.run(meta); } catch (e) { out = { pass: false, value: null, message: "Check error: " + (e instanceof Error ? e.message : "unknown") }; }
      results.push({ id: c.id, pass: !!out.pass, value: out.value, message: out.message, weight: c.weight });
      if (out.pass) earned += c.weight;
    }
    const total = SEO_CHECKS.reduce((s, c) => s + c.weight, 0);
    const passing = results.filter(r => r.pass).length;
    const warnings = results.filter(r => !r.pass).length;
    return {
      url,
      fetchedMs: Date.now() - start,
      score: earned,
      total,
      counts: { passing, warnings, total: results.length },
      results,
    };
  });

// =====================================================================
// Email deliverability (SPF + DKIM + DMARC + MX)
// =====================================================================

function parseSpf(answers: Array<{ data: string }>): { present: boolean; valid: boolean; record: string } {
  if (answers.length === 0) return { present: false, valid: false, record: "" };
  const txt = answers.map(a => a.data).join("").replace(/"\s*"/g, "");
  if (!txt.toLowerCase().startsWith("v=spf1")) return { present: true, valid: false, record: txt.slice(0, 200) };
  return { present: true, valid: true, record: txt.slice(0, 200) };
}

function parseDmarc(answers: Array<{ data: string }>): { present: boolean; valid: boolean; record: string; policy: string } {
  if (answers.length === 0) return { present: false, valid: false, record: "", policy: "" };
  const txt = answers.map(a => a.data).join("").replace(/"\s*"/g, "");
  if (!txt.toLowerCase().startsWith("v=dmarc1")) return { present: true, valid: false, record: txt.slice(0, 200), policy: "" };
  const policy = txt.match(/p\s*=\s*(\w+)/i)?.[1]?.toLowerCase() ?? "none";
  return { present: true, valid: true, record: txt.slice(0, 200), policy };
}

function parseMx(answers: Array<{ data: string }>): { present: boolean; records: Array<{ preference: number; exchange: string }> } {
  if (answers.length === 0) return { present: false, records: [] };
  const records = answers
    .map(a => {
      const parts = a.data.split(/\s+/);
      const preference = Number(parts[0]);
      const exchange = parts[1]?.toLowerCase().replace(/\.$/, "") ?? "";
      return { preference, exchange };
    })
    .filter(r => Number.isFinite(r.preference) && r.exchange)
    .sort((a, b) => a.preference - b.preference);
  return { present: records.length > 0, records };
}

function computeEmailScore(spf: { present: boolean; valid: boolean }, dkim: { present: boolean; valid: boolean }, dmarc: { present: boolean; valid: boolean; policy: string }, mx: { present: boolean }) {
  let score = 0;
  const issues: string[] = [];
  if (spf.present) { score += 25; if (!spf.valid) issues.push("SPF record is malformed."); }
  else issues.push("No SPF record found.");
  if (dkim.present) { score += 25; if (!dkim.valid) issues.push("DKIM record is malformed."); }
  else issues.push("No DKIM record found at the queried selector.");
  if (dmarc.present) {
    score += 30;
    if (!dmarc.valid) issues.push("DMARC record is malformed.");
    else if (dmarc.policy === "none") { score += 0; issues.push("DMARC policy is 'none' — consider 'quarantine' or 'reject'."); }
    else if (dmarc.policy === "quarantine") score += 10;
    else if (dmarc.policy === "reject") score += 15;
  } else issues.push("No DMARC record found.");
  if (mx.present) score += 20;
  else issues.push("No MX records found.");
  if (score > 100) score = 100;
  let risk: string;
  if (score >= 80) risk = "low";
  else if (score >= 50) risk = "medium";
  else risk = "high";
  return { score, risk, issues };
}

export const checkEmailDeliverability = createServerFn({ method: "GET" })
  .validator(z.object({ domain: z.string(), selector: z.string().optional() }))
  .handler(async ({ data }) => {
    const domain = (data.domain || "").trim().toLowerCase();
    const selector = (data.selector || "default").trim().toLowerCase();
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return { error: "invalid_domain", message: "Please provide a valid domain (e.g. example.com)." };
    const start = Date.now();
    const [spfRec, dmarcRec, mxRec, dkimRec] = await Promise.all([
      doh(domain, 16),
      doh(`_dmarc.${domain}`, 16),
      doh(domain, 15),
      doh(`${selector}._domainkey.${domain}`, 16),
    ]);
    const spf = parseSpf(spfRec);
    const dmarc = parseDmarc(dmarcRec);
    const mx = parseMx(mxRec);
    const dkim = { present: dkimRec.length > 0, valid: dkimRec.length > 0, record: dkimRec[0]?.data?.slice(0, 100) ?? "" };
    const { score, risk, issues } = computeEmailScore(spf, dkim, dmarc, mx);
    return {
      domain,
      fetchedMs: Date.now() - start,
      score,
      risk,
      issues,
      records: {
        spf: { ...spf, raw: spfRec.map(a => a.data) },
        dkim,
        dmarc: { ...dmarc, raw: dmarcRec.map(a => a.data) },
        mx,
      },
    };
  });

// =====================================================================
// What is my IP (reads CF-Connecting-IP server-side, then geolocates)
// Avoids CORS issues that affect browser-direct ipapi.co calls.
// =====================================================================
export const detectMyIp = createServerFn({ method: "GET" })
  .handler(async ({ request }: { request?: Request } = {}) => {
    let detectedIp = "";
    try {
      const req = (globalThis as { __nitro_req__?: { headers: Headers } }).__nitro_req__;
      const headers = request?.headers ?? req?.headers;
      if (headers) {
        detectedIp = headers.get("cf-connecting-ip") ||
                     headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     "";
      }
    } catch { /* ignore */ }
    if (!detectedIp) return { error: "no_ip", message: "Could not detect your network. Try refreshing." };
    const start = Date.now();
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(detectedIp)}/json/`);
    if (!response.ok) return { error: "lookup_failed", message: `IP lookup service returned HTTP ${response.status}.` };
    const data = await response.json() as Record<string, unknown>;
    if (data.error) return { error: "lookup_failed", message: str(data.reason, "IP lookup service returned an error.") };
    return { detectedIp, fetchedMs: Date.now() - start, geo: data };
  });
