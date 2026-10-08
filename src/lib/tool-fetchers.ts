// Live diagnostic fetchers for the tools that need real network data.
// Each function returns a ToolResult that matches what the UI expects,
// or throws a user-friendly error message that the workspace displays.
//
// The 4 existing Cloudflare Pages Functions (ip-reputation, http-headers,
// seo-check, email-deliverability) are called via /api/<name>.
// Everything else calls free public APIs directly from the browser.

import type { ToolResult } from "./tool-workspaces";
import {
  checkIpReputation,
  checkHttpHeaders,
  checkSeo,
  checkEmailDeliverability,
} from "./server-tools";

// Cloudflare Workers/Pages Functions are ignored when _worker.js is
// present (the TanStack Start SSR bundle). The four diagnostic Workers
// in functions/api/*.js were ported to src/lib/server-tools.ts and are
// called via createServerFn wrappers, so the fetcher layer is unchanged.

const IPAPI = (ip: string) => `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
const DOH_CF = "https://cloudflare-dns.com/dns-query";
const DOH_GOOGLE = "https://dns.google/resolve";
const DOH_QUAD9 = "https://dns.quad9.net/dns-query";
const TIMEOUT_MS = 10000;
const str = (v: unknown, fallback = "—") => (typeof v === "string" || typeof v === "number") && v !== "" ? String(v) : fallback;

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    if (!r.ok) throw new Error(`Request failed (HTTP ${r.status})`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal });
    if (!r.ok) throw new Error(`Request failed (HTTP ${r.status})`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

// =====================================================================
// IP lookup (ipapi.co)
// =====================================================================
export async function fetchIpLookup(ip: string): Promise<ToolResult> {
  const data = await fetchJson(IPAPI(ip)) as Record<string, unknown>;
  if (data.error) throw new Error(str(data.reason, "IP lookup service returned an error."));
  return {
    title: "IP overview",
    metrics: [
      ["IP address", str(data.ip, ip)],
      ["Organization", str(data.org)],
      ["Location", `${str(data.city)}, ${str(data.country_name)}`],
      ["Network", str(data.asn)],
    ],
    columns: ["Property", "Value"],
    rows: [
      ["Country", str(data.country_name)],
      ["Country code", str(data.country_code)],
      ["Region", str(data.region)],
      ["Region code", str(data.region_code)],
      ["City", str(data.city)],
      ["Postal code", str(data.postal)],
      ["Latitude", data.latitude !== undefined ? String(data.latitude) : "—"],
      ["Longitude", data.longitude !== undefined ? String(data.longitude) : "—"],
      ["Timezone", str(data.timezone)],
      ["UTC offset", str(data.utc_offset)],
      ["ASN", str(data.asn)],
      ["Organization", str(data.org)],
      ["Address type", data.version ? `IPv${data.version}` : "—"],
      ["Source", "ipapi.co · live"],
    ],
  };
}

// =====================================================================
// IP reputation (/api/ip-reputation, existing Worker — 7 DNSBLs + geo)
// =====================================================================
export async function fetchIpReputation(ip: string): Promise<ToolResult> {
  const data = await checkIpReputation({ data: { ip } }) as {
    error?: string; message?: string; ip?: string; score?: number; risk?: string;
    dnsbl?: { checked: number; listed: number; total: number; results: Array<{ label: string; listed: boolean | null; codes: string[]; error: string | null }> };
    geo?: { country?: string; city?: string; isp?: string; org?: string; proxy?: boolean; hosting?: boolean; mobile?: boolean } | null;
  };
  if (data.error) throw new Error(data.message ?? "Reputation check failed.");
  const risk = (data.risk ?? "unknown").toString().toUpperCase();
  const dns = data.dnsbl ?? { checked: 0, listed: 0, total: 0, results: [] };
  return {
    title: "IP reputation report",
    metrics: [
      ["IP address", str(data.ip, ip)],
      ["Listed", `${dns.listed} of ${dns.total}`],
      ["Risk signal", risk],
      ["Score", `${str(data.score)}/100`],
    ],
    columns: ["Blocklist", "Status", "Detail"],
    rows: [
      ...dns.results.map(r => [
        r.label,
        r.listed === true ? "LISTED" : r.listed === false ? "Clean" : r.error ? `Error (${r.error})` : "Unknown",
        r.codes.length > 0 ? `Codes: ${r.codes.join(", ")}` : r.listed === false ? "No listing found" : "—",
      ] as [string, string, string]),
      ...(data.geo ? [
        ["Geo country", str(data.geo.country)] as [string, string],
        ["Geo city", str(data.geo.city)] as [string, string],
        ["ISP", str(data.geo.isp)] as [string, string],
        ["Organization", str(data.geo.org)] as [string, string],
        ["Proxy", data.geo.proxy ? "Yes" : "No"] as [string, string],
        ["Hosting", data.geo.hosting ? "Yes" : "No"] as [string, string],
        ["Mobile", data.geo.mobile ? "Yes" : "No"] as [string, string],
      ] : []),
    ],
  };
}

// =====================================================================
// What is my IP (browser-direct fetch — auto-detects caller's IP from
// the request. CORS works on ipwho.is + ip-api.com. Server-side fetches
// from Cloudflare Pages get HTTP 429'd because the edge IP range is
// shared and rate-limited by every geo provider's free tier.)
// =====================================================================
export async function fetchMyIp(): Promise<Record<string, unknown>> {
  // Provider 1: ipwho.is (no IP arg → auto-detects caller's IP)
  try {
    const r = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (r.ok) {
      const raw = await r.json() as Record<string, unknown>;
      if (raw.success !== false) {
        const conn = (raw.connection && typeof raw.connection === "object" ? raw.connection : {}) as Record<string, unknown>;
        const tz = (raw.timezone && typeof raw.timezone === "object" ? raw.timezone : {}) as Record<string, unknown>;
        return {
          provider: "ipwho.is",
          ip: raw.ip,
          version: raw.type,
          country_name: raw.country,
          country_code: raw.country_code,
          region: raw.region,
          region_code: raw.region_code,
          city: raw.city,
          postal: raw.postal,
          latitude: raw.latitude,
          longitude: raw.longitude,
          timezone: tz.id,
          utc_offset: tz.offset,
          country_calling_code: raw.calling_code,
          country_capital: raw.capital,
          country_tld: "",
          continent_code: raw.continent_code,
          in_eu: raw.is_eu,
          currency_name: "",
          languages: "",
          country_area: 0,
          country_population: 0,
          asn: conn.asn,
          org: conn.org,
          isp: conn.isp,
        };
      }
    }
  } catch { /* try fallback */ }
  // Provider 2: ip-api.com (no IP arg → auto-detects caller's IP)
  try {
    const r = await fetch("https://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,isp,org,as,query,countryCode3,continent,continentCode,callingCode,capital,inEU", { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (r.ok) {
      const raw = await r.json() as Record<string, unknown>;
      if (raw.status !== "fail") {
        return {
          provider: "ip-api.com",
          ip: raw.query,
          version: typeof raw.query === "string" && raw.query.includes(":") ? "IPv6" : "IPv4",
          country_name: raw.country,
          country_code: raw.countryCode,
          region: raw.regionName,
          region_code: raw.region,
          city: raw.city,
          postal: raw.zip,
          latitude: raw.lat,
          longitude: raw.lon,
          timezone: raw.timezone,
          utc_offset: typeof raw.offset === "number" ? raw.offset : 0,
          country_calling_code: raw.callingCode,
          country_capital: raw.capital,
          country_tld: "",
          continent_code: raw.continentCode,
          in_eu: raw.inEU,
          currency_name: "",
          languages: "",
          country_area: 0,
          country_population: 0,
          asn: raw.as,
          org: raw.org,
          isp: raw.isp,
        };
      }
    }
  } catch { /* both failed */ }
  throw new Error("IP lookup services are rate-limiting from this network. Try again in a minute.");
}

// =====================================================================
// VPN check (ipapi.co — has proxy/hosting/mobile fields)
// =====================================================================
export async function fetchVpnCheck(ip: string): Promise<ToolResult> {
  const data = await fetchJson(IPAPI(ip)) as Record<string, unknown>;
  if (data.error) throw new Error(str(data.reason, "VPN check failed."));
  // ipapi.co doesn't have explicit proxy/VPN fields in the free tier.
  // Use the connection data: ASN, org, and country to characterize.
  const asn = str(data.asn);
  const org = str(data.org);
  const isHosting = /cloud|host|datacenter|server|digital|amazon|google|microsoft|oracle|linode|vultr|ovh|hetzner/i.test(org + " " + asn);
  const isMobile = /mobile|wireless|cellular|verizon|att|t-mobile|vodafone|orange|telefonica/i.test(org);
  const classification = isHosting ? "Datacenter / hosting" : isMobile ? "Mobile carrier" : "Residential / business";
  return {
    title: "Connection classification",
    metrics: [
      ["IP address", str(data.ip, ip)],
      ["Connection", classification],
      ["Provider", org],
      ["Network", asn],
    ],
    columns: ["Signal", "Detected", "Detail"],
    rows: [
      ["Hosting", isHosting ? "Yes" : "No", isHosting ? "Datacenter network" : "Not a known hosting provider"],
      ["Mobile carrier", isMobile ? "Yes" : "No", isMobile ? "Mobile network" : "Not a mobile network"],
      ["ASN", asn, "Autonomous system"],
      ["Organization", org, "Network operator"],
      ["Country", str(data.country_name), "Geographic location"],
      ["Region", str(data.region), "Sub-country region"],
      ["City", str(data.city), "City"],
      ["Source", "ipapi.co · live", "Connection signals"],
    ],
  };
}

// =====================================================================
// DNS lookup (Cloudflare DoH)
// =====================================================================
const RECORD_TYPES: Record<string, number> = { A: 1, AAAA: 28, MX: 15, TXT: 16, CNAME: 5, NS: 2, SOA: 6, CAA: 257 };
export async function fetchDnsLookup(domain: string, recordType: string): Promise<ToolResult> {
  const typeNum = RECORD_TYPES[recordType] ?? 1;
  const url = `${DOH_CF}?name=${encodeURIComponent(domain)}&type=${typeNum}`;
  const data = await fetchJson(url, { headers: { Accept: "application/dns-json" } }) as { Status: number; Answer?: Array<{ name: string; type: number; TTL: number; data: string }> };
  if (data.Status !== 0) throw new Error(`DNS query returned status ${data.Status}`);
  const answers = data.Answer ?? [];
  return {
    title: "DNS records",
    metrics: [
      ["Domain", domain],
      ["Record type", recordType],
      ["Records", String(answers.length)],
    ],
    columns: ["Name", "Type", "TTL", "Value"],
    rows: answers.length === 0
      ? [["No records found", "—", "—", "Try another record type"]]
      : answers.map(a => [a.name, recordType, String(a.TTL), a.data]),
  };
}

// =====================================================================
// DNS propagation (multiple DoH resolvers)
// =====================================================================
const RESOLVERS: Array<{ label: string; url: string; type: "doh-json" | "doh-wire" }> = [
  { label: "Cloudflare · 1.1.1.1", url: DOH_CF, type: "doh-wire" },
  { label: "Google · 8.8.8.8", url: DOH_GOOGLE, type: "doh-json" },
  { label: "Quad9 · 9.9.9.9", url: DOH_QUAD9, type: "doh-wire" },
  { label: "Cloudflare · 1.0.0.1", url: DOH_CF, type: "doh-wire" },
  { label: "Google · 8.8.4.4", url: DOH_GOOGLE, type: "doh-json" },
  { label: "Quad9 · 149.112.112.112", url: DOH_QUAD9, type: "doh-wire" },
];

export async function fetchDnsPropagation(domain: string, recordType: string): Promise<ToolResult> {
  const typeNum = RECORD_TYPES[recordType] ?? 1;
  const queries = RESOLVERS.map(async (resolver) => {
    try {
      let answers: string[] = [];
      if (resolver.type === "doh-json") {
        const url = `${resolver.url}?name=${encodeURIComponent(domain)}&type=${typeNum}`;
        const data = await fetchJson(url) as { Answer?: Array<{ data: string }> };
        answers = (data.Answer ?? []).map(a => a.data);
      } else {
        const url = `${resolver.url}?name=${encodeURIComponent(domain)}&type=${typeNum}`;
        const data = await fetchJson(url, { headers: { Accept: "application/dns-json" } }) as { Answer?: Array<{ data: string }> };
        answers = (data.Answer ?? []).map(a => a.data);
      }
      return { label: resolver.label, answers, error: null as string | null };
    } catch (e) {
      return { label: resolver.label, answers: [] as string[], error: e instanceof Error ? e.message : "error" };
    }
  });
  const results = await Promise.all(queries);
  const firstAnswer = results.find(r => r.answers.length > 0)?.answers.join(", ") ?? "—";
  const matches = results.filter(r => r.answers.join(", ") === firstAnswer).length;
  return {
    title: "Global DNS snapshot",
    metrics: [
      ["Domain", domain],
      ["Record type", recordType],
      ["Agreement", `${matches} of ${results.length}`],
    ],
    columns: ["Resolver", "Answer", "Status"],
    rows: results.map(r => [
      r.label,
      r.answers.length > 0 ? r.answers.join(", ") : "—",
      r.error ? `Error: ${r.error}` : r.answers.join(", ") === firstAnswer ? "Matches" : "Different",
    ]),
  };
}

// =====================================================================
// Ping test (browser fetch with timing — not ICMP but a real measurement)
// =====================================================================
export async function fetchPingTest(target: string, count: number): Promise<ToolResult> {
  // We can't do ICMP from a browser, but a HEAD/GET to the target measures
  // the HTTP round-trip time which is a useful approximation.
  const url = target.startsWith("http") ? target : `https://${target}`;
  const timings: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    try {
      await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" });
    } catch { /* no-cors swallows errors but we still measure timing */ }
    timings.push(Math.round(performance.now() - start));
  }
  const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
  const min = Math.min(...timings);
  const max = Math.max(...timings);
  return {
    title: "Latency report",
    metrics: [
      ["Target", target],
      ["Average", `${avg} ms`],
      ["Minimum", `${min} ms`],
      ["Maximum", `${max} ms`],
    ],
    columns: ["Sequence", "Latency", "Status"],
    rows: timings.map((t, i) => [String(i + 1), `${t} ms`, "Received"]),
  };
}

// =====================================================================
// Is it down? (browser fetch + status check)
// =====================================================================
export async function fetchIsItDown(url: string): Promise<ToolResult> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const start = performance.now();
  try {
    const r = await fetch(target, { method: "HEAD", redirect: "follow", cache: "no-store" });
    const ms = Math.round(performance.now() - start);
    const reachable = r.ok || (r.status >= 200 && r.status < 500);
    return {
      title: "Availability report",
      metrics: [
        ["Website", target],
        ["HTTP status", `${r.status} ${r.statusText}`],
        ["Response time", `${ms} ms`],
        ["Availability", reachable ? "Reachable" : "Errors"],
      ],
      columns: ["Check", "Result"],
      rows: [
        ["Final URL", r.url],
        ["HTTP status", `${r.status} ${r.statusText}`],
        ["Response time", `${ms} ms`],
        ["Availability", reachable ? "Reachable" : "Errors"],
        ["Source", "Browser fetch · live"],
      ],
    };
  } catch (e) {
    return {
      title: "Availability report",
      metrics: [["Website", target], ["HTTP status", "Unreachable"], ["Response time", "—"], ["Availability", "Down or unreachable"]],
      columns: ["Check", "Result"],
      rows: [["Error", e instanceof Error ? e.message : "Could not reach the site."], ["Source", "Browser fetch · live"]],
    };
  }
}

// =====================================================================
// Bulk URL status (parallel browser fetches)
// =====================================================================
export async function fetchBulkUrlStatus(urls: string[]): Promise<ToolResult> {
  const results = await Promise.all(urls.map(async (urlInput) => {
    const url = urlInput.startsWith("http") ? urlInput : `https://${urlInput}`;
    const start = performance.now();
    try {
      const r = await fetch(url, { method: "HEAD", redirect: "follow", cache: "no-store" });
      const ms = Math.round(performance.now() - start);
      return { url, status: r.status, statusText: r.statusText, ms, finalUrl: r.url, error: null as string | null };
    } catch (e) {
      return { url, status: 0, statusText: "Error", ms: Math.round(performance.now() - start), finalUrl: url, error: e instanceof Error ? e.message : "Network error" };
    }
  }));
  const reachable = results.filter(r => r.status >= 200 && r.status < 400).length;
  const redirected = results.filter(r => r.status >= 300 && r.status < 400).length;
  const errors = results.filter(r => r.error !== null || r.status === 0 || r.status >= 400).length;
  return {
    title: "URL status report",
    metrics: [
      ["URLs", String(results.length)],
      ["Reachable", String(reachable)],
      ["Redirected", String(redirected)],
      ["Errors", String(errors)],
    ],
    columns: ["URL", "Status", "Time", "Final destination"],
    rows: results.map(r => [
      r.url,
      r.error ? "Error" : `${r.status} ${r.statusText}`,
      `${r.ms} ms`,
      r.finalUrl,
    ]),
  };
}

// =====================================================================
// HTTP headers (/api/http-headers, existing Worker)
// =====================================================================
export async function fetchHttpHeaders(url: string, method: "GET" | "HEAD"): Promise<ToolResult> {
  const data = await checkHttpHeaders({ data: { url, method } }) as {
    error?: string; message?: string; status?: number; statusText?: string; fetchedMs?: number;
    finalUrl?: string; redirected?: boolean; httpVersion?: string; headers?: Record<string, string>;
  };
  if (data.error) throw new Error(data.message ?? "HTTP headers request failed.");
  const headers = Object.entries(data.headers ?? {});
  return {
    title: "Response headers",
    metrics: [
      ["Status", str(data.status) + " " + str(data.statusText)],
      ["Final URL", str(data.finalUrl, url)],
      ["Time", str(data.fetchedMs) + " ms"],
      ["Headers", String(headers.length)],
    ],
    columns: ["Header", "Value"],
    rows: headers.length === 0 ? [["No headers", "—"]] : headers.map(([k, v]) => [k, v]),
  };
}

// =====================================================================
// Security headers (uses the same Worker — renders a security analysis view)
// =====================================================================
export async function fetchSecurityHeaders(url: string): Promise<ToolResult> {
  const data = await checkHttpHeaders({ data: { url, method: "GET" } }) as {
    error?: string; message?: string; score?: number; grade?: string; present?: number; total?: number;
    checks?: Array<{ id: string; name: string; present: boolean; value: string; recommendation: string; weight: number }>;
    infoLeaks?: Array<{ header: string; value: string }>;
  };
  if (data.error) throw new Error(data.message ?? "Security audit failed.");
  const checks = data.checks ?? [];
  return {
    title: "Security header audit",
    metrics: [
      ["Grade", str(data.grade, "?")],
      ["Score", `${str(data.score)}/100`],
      ["Present", `${str(data.present)} of ${str(data.total)}`],
      ["Website", url],
    ],
    columns: ["Header", "Status", "Value / recommendation"],
    rows: [
      ...checks.map(c => [
        c.name,
        c.present ? "Present" : "Missing",
        c.present ? c.value : c.recommendation,
      ] as [string, string, string]),
      ...((data.infoLeaks ?? []).map(l => [`Info leak · ${l.header}`, "Exposed", l.value] as [string, string, string])),
    ],
  };
}

// =====================================================================
// Email deliverability (/api/email-deliverability, existing Worker)
// =====================================================================
export async function fetchEmailDeliverability(domain: string, selector: string): Promise<ToolResult> {
  const data = await checkEmailDeliverability({ data: { domain, selector } }) as {
    error?: string; message?: string; domain?: string; score?: number; risk?: string; issues?: string[];
    records?: {
      spf?: { present: boolean; valid: boolean; raw: string[]; record: string };
      dkim?: { present: boolean; valid: boolean; raw: string[]; record: string };
      dmarc?: { present: boolean; valid: boolean; raw: string[]; record: string; policy: string };
      mx?: { present: boolean; records: Array<{ preference: number; exchange: string }> };
    };
  };
  if (data.error) throw new Error(data.message ?? "Email deliverability check failed.");
  const spf = data.records?.spf;
  const dkim = data.records?.dkim;
  const dmarc = data.records?.dmarc;
  const mx = data.records?.mx;
  return {
    title: "Email authentication",
    metrics: [
      ["Domain", str(data.domain, domain)],
      ["Score", `${str(data.score)}/100`],
      ["Risk", str(data.risk, "unknown").toUpperCase()],
      ["Issues", String((data.issues ?? []).length)],
    ],
    columns: ["Record", "Status", "Value"],
    rows: [
      ["SPF", spf?.present ? (spf.valid ? "Valid" : "Invalid") : "Missing", spf?.record ?? "—"],
      [`DKIM · ${selector}`, dkim?.present ? (dkim.valid ? "Valid" : "Invalid") : "Not found", dkim?.record?.slice(0, 80) ?? "—"],
      ["DMARC", dmarc?.present ? (dmarc.valid ? `${dmarc.policy ?? "Valid"}` : "Invalid") : "Missing", dmarc?.record?.slice(0, 80) ?? "—"],
      ["MX", mx?.present ? `${mx.records.length} record${mx.records.length === 1 ? "" : "s"}` : "Missing", mx?.records.map(r => `${r.preference} ${r.exchange}`).join(", ") ?? "—"],
      ...((data.issues ?? []).map(issue => ["Issue", "—", issue] as [string, string, string])),
    ],
  };
}

// =====================================================================
// SEO checker (/api/seo-check, existing Worker)
// =====================================================================
export async function fetchSeoCheck(url: string): Promise<ToolResult> {
  const data = await checkSeo({ data: { url } }) as {
    error?: string; message?: string; score?: number; total?: number;
    counts?: { passing: number; warnings: number; total: number };
    results?: Array<{ id: string; pass: boolean | null; message: string; value: unknown; weight: number }>;
  };
  if (data.error) throw new Error(data.message ?? "SEO check failed.");
  const results = data.results ?? [];
  const counts = data.counts ?? { passing: 0, warnings: 0, total: 0 };
  return {
    title: "On-page SEO audit",
    metrics: [
      ["URL", url],
      ["Score", `${str(data.score)} / ${str(data.total, "100")}`],
      ["Passed", `${counts.passing} of ${counts.total}`],
      ["Warnings", String(counts.warnings)],
    ],
    columns: ["Check", "Status", "Detail"],
    rows: results.map(r => [
      r.id.replace(/_/g, " "),
      r.pass === true ? "Passed" : r.pass === false ? "Warning" : "Info",
      r.message,
    ]),
  };
}

// =====================================================================
// Open Graph preview (browser fetch + parse meta tags)
// =====================================================================
export async function fetchOpenGraph(url: string, platform: string): Promise<ToolResult> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const html = await fetchText(target, { headers: { "User-Agent": "SiteTrace-OG/1.0" } });
  const get = (name: string): string | null => {
    const m = html.match(new RegExp(`<meta\\s+[^>]*?(?:name|property)=["']${name}["'][^>]*?content=["']([^"']+)["']`, "i"));
    if (m) return m[1];
    const m2 = html.match(new RegExp(`<meta\\s+[^>]*?content=["']([^"']+)["'][^>]*?(?:name|property)=["']${name}["']`, "i"));
    return m2 ? m2[1] : null;
  };
  const ogTitle = get("og:title") ?? get("twitter:title") ?? (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? null);
  const ogDescription = get("og:description") ?? get("twitter:description") ?? get("description");
  const ogImage = get("og:image") ?? get("twitter:image");
  const ogUrl = get("og:url") ?? target;
  const ogType = get("og:type") ?? "—";
  const ogSiteName = get("og:site_name");
  const ogLocale = get("og:locale");
  const twitterCard = get("twitter:card");
  return {
    title: "Social sharing preview",
    metrics: [
      ["URL", ogUrl],
      ["Title", str(ogTitle)],
      ["Description", ogDescription?.slice(0, 120) ?? "—"],
      ["Type", ogType],
    ],
    preview: {
      title: ogTitle ?? "Untitled",
      description: ogDescription ?? "No description provided.",
      domain: new URL(ogUrl).hostname,
    },
    columns: ["Tag", "Value"],
    rows: [
      ["og:title", str(ogTitle)],
      ["og:description", ogDescription?.slice(0, 200) ?? "—"],
      ["og:url", ogUrl],
      ["og:type", ogType],
      ["og:image", ogImage ? (ogImage.length > 60 ? ogImage.slice(0, 60) + "…" : ogImage) : "Not provided"],
      ["og:site_name", str(ogSiteName)],
      ["og:locale", str(ogLocale)],
      ["twitter:card", str(twitterCard)],
      ["platform", platform],
      ["Source", "Browser fetch · live"],
    ],
  };
}
