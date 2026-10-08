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
  checkIsItDown,
  checkBulkUrlStatus,
  checkHttpLatency,
  checkOpenGraph,
} from "./server-tools";

// Cloudflare Workers/Pages Functions are ignored when _worker.js is
// present (the TanStack Start SSR bundle). The four diagnostic Workers
// in functions/api/*.js were ported to src/lib/server-tools.ts and are
// called via createServerFn wrappers, so the fetcher layer is unchanged.

const IPAPI = (ip: string) => `https://ipwho.is/${encodeURIComponent(ip)}`;
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

// =====================================================================
// IP lookup (ipapi.co)
// =====================================================================
export async function fetchIpLookup(ip: string): Promise<ToolResult> {
  // ipwho.is is CORS-friendly for browser calls; ipapi.co now blocks
  // browser-direct requests via a Cloudflare challenge.
  const data = await fetchJson(IPAPI(ip)) as Record<string, unknown>;
  if (data.success === false) throw new Error(str(data.message, "IP lookup service returned an error."));
  // ipwho.is nests ASN/org/ISP under a `connection` object.
  const conn = (data["connection"] && typeof data["connection"] === "object" ? data["connection"] : {}) as Record<string, unknown>;
  const tz = (data["timezone"] && typeof data["timezone"] === "object" ? data["timezone"] : {}) as Record<string, unknown>;
  const asn = conn["asn"] ?? data["asn"];
  const org = conn["org"] ?? data["org"] ?? conn["isp"] ?? data["isp"];
  return {
    title: "IP overview",
    metrics: [
      ["IP address", str(data["ip"], ip)],
      ["Organization", str(org)],
      ["Location", `${str(data["city"])}, ${str(data["country"])}`],
      ["Network", asn !== undefined ? `AS${str(asn)}` : "—"],
    ],
    columns: ["Property", "Value"],
    rows: [
      ["Country", str(data["country"])],
      ["Country code", str(data["country_code"])],
      ["Region", str(data["region"])],
      ["Region code", str(data["region_code"])],
      ["City", str(data["city"])],
      ["Postal code", str(data["postal"])],
      ["Latitude", data["latitude"] !== undefined ? String(data["latitude"]) : "—"],
      ["Longitude", data["longitude"] !== undefined ? String(data["longitude"]) : "—"],
      ["Timezone", str(tz["id"] ?? data["timezone"])],
      ["UTC offset", str(tz["utc"] ?? data["utc_offset"])],
      ["ASN", asn !== undefined ? `AS${str(asn)}` : "—"],
      ["Organization", str(org)],
      ["ISP", str(conn["isp"] ?? data["isp"])],
      ["Address type", data["type"] ? `IPv${String(data["type"]).replace(/^IPv/, "")}` : "—"],
      ["Source", "ipwho.is · live"],
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
// VPN check (ipwho.is — browser-CORS-friendly)
// Classifies the connection based on ASN + org heuristics. ipwho.is
// doesn't expose explicit proxy/hosting/mobile fields, so we infer from
// the network operator's name. Same heuristic as before, just a
// different data source.
// =====================================================================
export async function fetchVpnCheck(ip: string): Promise<ToolResult> {
  const data = await fetchJson(IPAPI(ip)) as Record<string, unknown>;
  if (data.success === false) throw new Error(str(data.message, "VPN check failed."));
  // ipwho.is nests ASN/org/ISP under `connection`; older fields were top-level.
  const conn = (data["connection"] && typeof data["connection"] === "object" ? data["connection"] : {}) as Record<string, unknown>;
  const asn = str(conn["asn"] ?? data["asn"]);
  const org = str(conn["org"] ?? data["org"]);
  const isp = str(conn["isp"] ?? data["isp"] ?? org);
  const haystack = `${org} ${isp} ${asn}`;
  const isHosting = /cloud|host|datacenter|server|digital|amazon|google|microsoft|oracle|linode|vultr|ovh|hetzner|leaseweb|choopa|psychz|cogent|ntt|verisign|akamai|fastly|cloudflare/i.test(haystack);
  const isMobile = /mobile|wireless|cellular|verizon|att|t-mobile|vodafone|orange|telefonica|t-mobile|three|EE |sprint/i.test(haystack);
  const classification = isHosting ? "Datacenter / hosting" : isMobile ? "Mobile carrier" : "Residential / business";
  return {
    title: "Connection classification",
    metrics: [
      ["IP address", str(data["ip"], ip)],
      ["Connection", classification],
      ["Provider", org],
      ["Network", asn ? `AS${asn}` : "—"],
    ],
    columns: ["Signal", "Detected", "Detail"],
    rows: [
      ["Hosting", isHosting ? "Yes" : "No", isHosting ? "Datacenter network" : "Not a known hosting provider"],
      ["Mobile carrier", isMobile ? "Yes" : "No", isMobile ? "Mobile network" : "Not a mobile network"],
      ["ASN", asn ? `AS${asn}` : "—", "Autonomous system"],
      ["Organization", org, "Network operator"],
      ["ISP", isp, "Internet service provider"],
      ["Country", str(data["country"]), "Geographic location"],
      ["Region", str(data["region"]), "Sub-country region"],
      ["City", str(data["city"]), "City"],
      ["Source", "ipwho.is · live", "Connection signals"],
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
// WHOIS lookup (RDAP — Registration Data Access Protocol, modern whois)
// RDAP returns JSON. CORS-friendly on most TLDs. Falls back to a clear
// error if the registrar doesn't expose RDAP.
// =====================================================================
export async function fetchWhoisLookup(domain: string): Promise<ToolResult> {
  // Find a RDAP bootstrap server for the TLD
  const tld = domain.split(".").pop()?.toLowerCase() ?? "";
  const bootstrap = await fetchJson("https://data.iana.org/rdap/dns.json") as { services: Array<[string[], string[]]> };
  const services = bootstrap.services ?? [];
  const match = services.find(([tlds]) => tlds.map(t => t.toLowerCase()).includes(tld));
  if (!match) throw new Error(`No RDAP service found for .${tld}`);
  const rdapUrl = match[1][0];
  if (!rdapUrl) throw new Error(`RDAP service for .${tld} is empty`);
  const data = await fetchJson(`${rdapUrl}domain/${encodeURIComponent(domain)}`) as {
    objectClassName?: string; ldhName?: string; status?: string[];
    events?: Array<{ eventAction: string; eventDate: string }>;
    entities?: Array<{ roles?: string[]; vcardArray?: unknown[]; publicIds?: unknown[] }>;
    nameservers?: Array<{ ldhName?: string }>;
    secureDNS?: { delegationSigned?: boolean };
  };
  const events = data.events ?? [];
  const findEvent = (action: string) => events.find(e => e.eventAction === action)?.eventDate ?? "—";
  const registrar = (data.entities ?? []).find(e => e.roles?.includes("registrar"));
  const registrarName = (registrar?.vcardArray?.[1] as unknown[] | undefined)?.find((c: unknown) => Array.isArray(c) && c[0] === "fn")?.[3] as string | undefined;
  // Translate the EPP status codes into plain English. Most domains have
  // a stack of "clientXxx prohibited" boilerplate that says little to a
  // typical user. We collapse the common locks and surface the rest.
  const EPP: Record<string, string> = {
    "client transfer prohibited": "Transfer locked at registrar",
    "client update prohibited": "Updates locked at registrar",
    "client delete prohibited": "Deletion locked at registrar",
    "client renew prohibited": "Renewal locked at registrar",
    "client hold": "Suspended by registrar",
    "server transfer prohibited": "Server-side transfer lock",
    "server update prohibited": "Server-side update lock",
    "server delete prohibited": "Server-side deletion lock",
    "server renew prohibited": "Server-side renewal lock",
    "server hold": "Suspended by registry",
    "ok": "Active (no locks)",
    "pending create": "Registration pending",
    "pending renew": "Renewal pending",
    "pending transfer": "Transfer pending",
    "pending update": "Update pending",
    "pending delete": "Deletion pending",
  };
  const rawStatus = data.status ?? [];
  const translated = rawStatus.map(s => EPP[s] ?? s);
  const locks = translated.filter(t =>
    /lock|suspend|prohibit|hold/i.test(t),
  );
  const statusSummary = locks.length === 0
    ? (translated.join(" · ") || "Active")
    : `${locks.length} lock${locks.length === 1 ? "" : "s"} active`;
  return {
    title: "Domain registration",
    metrics: [
      ["Domain", str(data.ldhName, domain)],
      ["Registered", findEvent("registration")],
      ["Last updated", findEvent("last changed")],
      ["Expires", findEvent("expiration")],
      ["Status", statusSummary],
    ],
    columns: ["Field", "Value"],
    rows: [
      ["Registrar", str(registrarName, "—")],
      ["Creation date", findEvent("registration")],
      ["Updated date", findEvent("last changed")],
      ["Expiration date", findEvent("expiration")],
      ["Locks", locks.length ? locks.join(" · ") : "None"],
      ["Nameservers", (data.nameservers ?? []).map(n => n.ldhName ?? "").filter(Boolean).join(" · ") || "—"],
      ["DNSSEC", data.secureDNS?.delegationSigned ? "signedDelegation" : "unsigned"],
      ["Source", "RDAP · live"],
      ["Cached", "Not stored"],
    ],
  };
}

// =====================================================================
// HTTP latency breakdown (server-side — total + TTFB + download)
//
// Honest disclaimer: a Cloudflare Worker can measure total time, TTFB, and
// download duration, but the per-phase breakdown (DNS, TCP, TLS) is opaque —
// the platform handles those and we can't see them. We show what we can
// actually measure and tell the user which phases aren't surfaced.
// =====================================================================
export async function fetchHttpLatency(url: string): Promise<ToolResult> {
  const data = await checkHttpLatency({ data: { url } }) as {
    error?: string; message?: string;
    inputUrl?: string; finalUrl?: string; status?: number; statusText?: string;
    totalMs?: number; ttfbMs?: number; downloadMs?: number; bytes?: number; note?: string;
  };
  if (data.error) throw new Error(data.message ?? "Latency check failed.");
  const target = data.inputUrl ?? url;
  const total = data.totalMs ?? 0;
  const ttfb = data.ttfbMs ?? 0;
  const download = data.downloadMs ?? 0;
  return {
    title: "Latency breakdown",
    metrics: [
      ["URL", target],
      ["Status", data.status ? `${data.status} ${data.statusText ?? ""}`.trim() : "—"],
      ["Total time", `${total} ms`],
      ["TTFB", `${ttfb} ms`],
    ],
    columns: ["Phase", "Time", "Note"],
    rows: [
      ["DNS lookup", "—", "Not exposed server-side (handled by platform)"],
      ["TCP connect", "—", "Not exposed server-side (handled by platform)"],
      ["TLS handshake", "—", "Not exposed server-side (handled by platform)"],
      ["Time to first byte", `${ttfb} ms`, "Server response start"],
      ["Content download", `${download} ms`, `${(data.bytes ?? 0).toLocaleString("en-US")} bytes received`],
      ["Total", `${total} ms`, "End-to-end"],
      ["Source", "Server fetch · live (no CORS)"],
      ["Note", data.note ?? ""],
    ],
  };
}

// =====================================================================
// Is it down? (server-side fetch — no CORS)
// =====================================================================
export async function fetchIsItDown(url: string): Promise<ToolResult> {
  const data = await checkIsItDown({ data: { url } }) as {
    error?: string; message?: string;
    inputUrl?: string; finalUrl?: string; redirected?: boolean;
    status?: number; statusText?: string; fetchedMs?: number; reachable?: boolean;
  };
  if (data.error) throw new Error(data.message ?? "Availability check failed.");
  const target = data.inputUrl ?? url;
  const ms = data.fetchedMs ?? 0;
  const reachable = data.reachable ?? false;
  return {
    title: "Availability report",
    metrics: [
      ["Website", target],
      ["HTTP status", data.status ? `${data.status} ${data.statusText ?? ""}`.trim() : "Unreachable"],
      ["Response time", data.status ? `${ms} ms` : "—"],
      ["Availability", reachable ? "Reachable" : "Down or unreachable"],
    ],
    columns: ["Check", "Result"],
    rows: [
      ["Final URL", data.finalUrl ?? target],
      ["Redirected", data.redirected ? "Yes" : "No"],
      ["HTTP status", data.status ? `${data.status} ${data.statusText ?? ""}`.trim() : "Unreachable"],
      ["Response time", data.status ? `${ms} ms` : "—"],
      ["Availability", reachable ? "Reachable" : "Down or unreachable"],
      ["Source", "Server fetch · live (no CORS)"],
    ],
  };
}

// =====================================================================
// Bulk URL status (server-side, parallel)
// =====================================================================
export async function fetchBulkUrlStatus(urls: string[]): Promise<ToolResult> {
  const data = await checkBulkUrlStatus({ data: { urls } }) as {
    error?: string; message?: string; count?: number;
    results?: Array<{ inputUrl: string; url: string; status: number; statusText: string; fetchedMs: number; finalUrl: string; error: string | null }>;
  };
  if (data.error || !data.results) throw new Error(data.message ?? "Bulk URL check failed.");
  const results = data.results;
  const reachable = results.filter(r => !r.error && r.status >= 200 && r.status < 400).length;
  const redirected = results.filter(r => !r.error && r.status >= 300 && r.status < 400).length;
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
      r.inputUrl,
      r.error ? `Error · ${r.error}` : `${r.status} ${r.statusText}`,
      `${r.fetchedMs} ms`,
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
  const data = await checkOpenGraph({ data: { url } }) as {
    error?: string; message?: string;
    inputUrl?: string; finalUrl?: string;
    title?: string | null; description?: string | null; image?: string | null;
    url?: string; type?: string | null; siteName?: string | null; locale?: string | null;
    twitterCard?: string | null;
  };
  if (data.error) throw new Error(data.message ?? "Open Graph check failed.");
  const target = data.inputUrl ?? url;
  const ogUrl = data.url ?? target;
  const ogTitle = data.title ?? null;
  const ogDescription = data.description ?? null;
  const ogImage = data.image ?? null;
  const ogType = data.type ?? "—";
  const ogSiteName = data.siteName ?? null;
  const ogLocale = data.locale ?? null;
  const twitterCard = data.twitterCard ?? null;
  let domain = target;
  try { domain = new URL(ogUrl).hostname; } catch { /* keep fallback */ }
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
      domain,
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
      ["Source", "Server fetch · live (no CORS)"],
    ],
  };
}
