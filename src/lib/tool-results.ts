import { workspaces, type ToolResult } from "./tool-workspaces";
import {
  fetchIpLookup,
  fetchIpReputation,
  fetchVpnCheck,
  fetchDnsLookup,
  fetchDnsPropagation,
  fetchWhoisLookup,
  fetchIsItDown,
  fetchBulkUrlStatus,
  fetchHttpHeaders,
  fetchSecurityHeaders,
  fetchHttpLatency,
  fetchEmailDeliverability,
  fetchSeoCheck,
  fetchOpenGraph,
  fetchMyIp,
} from "./tool-fetchers";

// Live diagnostic integration boundary: replace this function for remote checks.
// These responses deliberately remain fixed fixtures, never inferred live data.
export function getDiagnosticSample(slug: string): ToolResult {
  const workspace = workspaces[slug];
  if (!workspace) throw new Error("Unknown diagnostic");
  return structuredClone(workspace.sample);
}

export async function runLocalUtility(slug: string, values: Record<string, string>): Promise<ToolResult> {
  const text = values["target"] ?? "";
  if (slug === "ip-lookup") return await fetchIpLookup(text);
  if (slug === "ip-reputation") return await fetchIpReputation(text);
  if (slug === "vpn-check") return await fetchVpnCheck(text);
  if (slug === "dns-lookup") return await fetchDnsLookup(text, values["record"] ?? "A");
  if (slug === "dns-propagation") return await fetchDnsPropagation(text, values["record"] ?? "A");
  if (slug === "whois-lookup") return await fetchWhoisLookup(text);
  if (slug === "is-it-down") return await fetchIsItDown(text);
  if (slug === "bulk-url-status") return await fetchBulkUrlStatus(text.split(/\n/).map(s => s.trim()).filter(Boolean));
  if (slug === "http-headers") return await fetchHttpHeaders(text, (values["method"] === "GET" ? "GET" : "HEAD"));
  if (slug === "security-headers") return await fetchSecurityHeaders(text);
  if (slug === "http-latency") return await fetchHttpLatency(text);
  if (slug === "email-deliverability") return await fetchEmailDeliverability(text, values["selector"] ?? "default");
  if (slug === "seo-checker") return await fetchSeoCheck(text);
  if (slug === "open-graph-preview") return await fetchOpenGraph(text, values["platform"] ?? "Open Graph");
  if (slug === "what-is-my-ip") {
    const data = await fetchMyIp();
    const str = (v: unknown, fallback = "—") => (typeof v === "string" || typeof v === "number") && v !== "" ? String(v) : fallback;
    const yesNo = (v: unknown) => v === true ? "Yes" : v === false ? "No" : "—";
    const langs = Array.isArray(data.languages) ? (data.languages as string[]).join(", ") : "—";
    return {
      title: "Your network",
      metrics: [
        ["Public IP", str(data.ip, "Unknown")],
        ["Country", data.country_name ? `${str(data.country_name)} (${str(data.country_code, "?")})` : "Unknown"],
        ["City", `${str(data.city, "Unknown")}, ${str(data.region)}`],
        ["ISP", str(data.org, "Unknown")],
        ["Timezone", str(data.timezone, "Unknown")],
        ["Connection", typeof navigator !== "undefined" && navigator.onLine ? "Online" : "Offline"],
      ],
      columns: ["Property", "Value"],
      rows: [
        ["IP version", str(data.version, "4")],
        ["ASN", str(data.asn)],
        ["Organization", str(data.org)],
        ["Region", str(data.region)],
        ["Region code", str(data.region_code)],
        ["Postal code", str(data.postal)],
        ["Latitude", data.latitude !== undefined ? String(data.latitude) : "—"],
        ["Longitude", data.longitude !== undefined ? String(data.longitude) : "—"],
        ["UTC offset", str(data.utc_offset)],
        ["Calling code", str(data.country_calling_code)],
        ["Capital", str(data.country_capital)],
        ["TLD", str(data.country_tld)],
        ["Continent", str(data.continent_code)],
        ["In EU", yesNo(data.in_eu)],
        ["Currency", str(data.currency_name)],
        ["Languages", langs],
        ["Country area", data.country_area !== undefined ? `${str(data.country_area)} km²` : "—"],
        ["Country population", data.country_population !== undefined ? Number(data.country_population).toLocaleString("en-US") : "—"],
        ["User agent", typeof navigator !== "undefined" ? navigator.userAgent : "—"],
        ["Platform", typeof navigator !== "undefined" ? (navigator.platform || "Unknown") : "—"],
        ["Language", typeof navigator !== "undefined" ? navigator.language : "—"],
        ["Screen", typeof screen !== "undefined" ? `${screen.width} × ${screen.height}` : "—"],
        ["Color depth", typeof screen !== "undefined" ? `${screen.colorDepth} bit` : "—"],
        ["Cookies", typeof navigator !== "undefined" ? (navigator.cookieEnabled ? "Enabled" : "Disabled") : "—"],
        ["CPU cores", typeof navigator !== "undefined" ? str(navigator.hardwareConcurrency, "Unknown") : "—"],
        ["Source", `${str(data.provider)} · live detection (browser)`],
        ["Cached", "Not stored"],
      ],
      live: true,
    };
  }
  if (slug === "word-counter") {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { title: "Text statistics", metrics: [["Words", String(words)], ["Characters", String(Array.from(text).length)], ["Without spaces", String(Array.from(text.replace(/\s/g, "")).length)], ["Reading time", `${Math.ceil(words / 200)} min`]], columns: ["Measure", "Count"], rows: [["Sentences", String(text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0)], ["Paragraphs", String(text.trim() ? text.trim().split(/\n\s*\n/).length : 0)], ["Lines", String(text ? text.split("\n").length : 0)]] };
  }
  if (slug === "password-generator") {
    const groups = [["upper", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"], ["lower", "abcdefghijklmnopqrstuvwxyz"], ["digits", "0123456789"], ["symbols", "!@#$%^&*()-_=+[]{}?"]].filter(([key]) => values[key ?? ""] === "true").map(([, group]) => group ?? "");
    const length = Number(values["length"]);
    if (!Number.isInteger(length) || length < 8 || length > 128) throw new Error("Choose a password length from 8 to 128.");
    if (!groups.length) throw new Error("Select at least one character type.");
    const alphabet = groups.join("");
    const randomIndex = (max: number) => { const limit = 256 - (256 % max); let byte = 255; while (byte >= limit) byte = crypto.getRandomValues(new Uint8Array(1))[0] ?? 255; return byte % max; };
    const characters = groups.map(group => group.charAt(randomIndex(group.length)));
    while (characters.length < length) characters.push(alphabet.charAt(randomIndex(alphabet.length)));
    for (let i = characters.length - 1; i > 0; i--) { const j = randomIndex(i + 1); const old = characters[i] ?? ""; characters[i] = characters[j] ?? ""; characters[j] = old; }
    return { title: "Generated password", text: characters.join(""), metrics: [["Length", String(length)], ["Character types", String(groups.length)], ["Randomness", "Cryptographic"], ["Storage", "Not saved"]] };
  }
  if (slug === "random-color") {
    const [r = 0, g = 0, b = 0] = crypto.getRandomValues(new Uint8Array(3));
    const hex = `#${[r, g, b].map(n => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const channels = [r / 255, g / 255, b / 255]; const max = Math.max(...channels); const min = Math.min(...channels); const d = max - min; const l = (max + min) / 2;
    let h = 0; if (d) { h = max === channels[0] ? ((g - b) / 255 / d) % 6 : max === channels[1] ? (b - r) / 255 / d + 2 : (r - g) / 255 / d + 4; h *= 60; if (h < 0) h += 360; }
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); const hsl = `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    return { title: "Your color", color: hex, text: values["format"] === "RGB" ? rgb : values["format"] === "HSL" ? hsl : hex, metrics: [["HEX", hex], ["RGB", `${r}, ${g}, ${b}`], ["HSL", `${Math.round(h)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`]] };
  }
  if (slug === "subnet-calculator") {
    const [address = "", prefixText = ""] = text.trim().split("/"); const prefix = Number(prefixText);
    const value = address.split(".").reduce((acc, part) => acc * 256 + Number(part), 0);
    const size = 2 ** (32 - prefix); const network = Math.floor(value / size) * size; const broadcast = network + size - 1;
    const dotted = (n: number) => [24, 16, 8, 0].map(shift => Math.floor(n / 2 ** shift) % 256).join(".");
    const hosts = prefix >= 31 ? size : size - 2;
    return { title: "Subnet breakdown", metrics: [["Network", `${dotted(network)}/${prefix}`], ["Subnet mask", dotted(2 ** 32 - size)], ["Total addresses", size.toLocaleString("en-US")], ["Usable hosts", hosts.toLocaleString("en-US")]], columns: ["Property", "Value"], rows: [["Network address", dotted(network)], ["Broadcast address", prefix >= 31 ? "Not applicable (RFC 3021 / host route)" : dotted(broadcast)], ["First usable address", dotted(prefix >= 31 ? network : network + 1)], ["Last usable address", dotted(prefix >= 31 ? broadcast : broadcast - 1)], ["Wildcard mask", dotted(size - 1)]] };
  }
  if (slug === "smart-dispatcher") {
    const target = text.trim(); const isUrl = /^https?:\/\//i.test(target); const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(target) || (!isUrl && target.includes(":"));
    const hostname = isUrl ? new URL(target).hostname : target;
    return { title: "Target classification", metrics: [["Target", hostname], ["Type", isUrl ? "Website URL" : isIp ? "IP address" : "Domain"], ["Protocol", isUrl ? new URL(target).protocol.replace(":", "").toUpperCase() : "—"]], columns: ["Suggested tool", "Purpose"], rows: isIp ? [["IP lookup", "Location and network ownership"], ["IP reputation", "Blocklist signals"], ["VPN check", "Connection classification"]] : isUrl ? [["HTTP headers", "Inspect response headers"], ["Security headers", "Audit website protection"], ["HTTP latency", "Break request into phases"]] : [["DNS lookup", "Resolve domain records"], ["WHOIS lookup", "Registration data"], ["DNS propagation", "Compare global answers"]] };
  }
  if (slug === "jwt-decoder") {
    const raw = text.trim();
    if (!raw) throw new Error("Paste a JWT to decode.");
    const parts = raw.split(".");
    if (parts.length !== 3) throw new Error("A JWT has three parts separated by dots (header.payload.signature).");
    const decode = (segment: string) => {
      const pad = segment + "===".slice(0, (4 - segment.length % 4) % 4);
      const norm = pad.replace(/-/g, "+").replace(/_/g, "/");
      try { return JSON.parse(atob(norm)); } catch { throw new Error("Could not decode — is this a valid JWT?"); }
    };
    let header: Record<string, unknown>, payload: Record<string, unknown>;
    try { header = decode(parts[0]!); payload = decode(parts[1]!); }
    catch (e) { throw new Error(e instanceof Error ? e.message : "Decode failed."); }
    const sigPreview = (parts[2] ?? "").slice(0, 16) + (parts[2] && parts[2].length > 16 ? "…" : "");
    const str = (v: unknown, fallback = "—") => (typeof v === "string" || typeof v === "number") && v !== "" ? String(v) : fallback;
    return {
      title: "JWT contents",
      metrics: [
        ["Algorithm", String(header.alg ?? "—")],
        ["Type", String(header.typ ?? "—")],
        ["Issued at", payload.iat ? new Date(Number(payload.iat) * 1000).toISOString() : "—"],
        ["Expires", payload.exp ? new Date(Number(payload.exp) * 1000).toISOString() : "—"],
        ["Signature preview", sigPreview || "—"],
      ],
      text: JSON.stringify({ header, payload }, null, 2),
      columns: ["Field", "Value"],
      rows: [
        ["header.alg", String(header.alg ?? "—")],
        ["header.typ", String(header.typ ?? "—")],
        ["payload.iss", str(payload.iss, "—")],
        ["payload.sub", str(payload.sub, "—")],
        ["payload.aud", str(payload.aud, "—")],
        ["payload.iat", payload.iat ? new Date(Number(payload.iat) * 1000).toISOString() : "—"],
        ["payload.exp", payload.exp ? new Date(Number(payload.exp) * 1000).toISOString() : "—"],
        ["payload.jti", str(payload.jti, "—")],
        ["Signature", sigPreview || "—"],
        ["Storage", "Decoded in browser · not sent anywhere"],
      ],
    };
  }
  if (slug === "email-header-parser") {
    const raw = text.trim();
    if (!raw) throw new Error("Paste a raw email header to parse.");
    // Split lines, fold continuation lines (those starting with whitespace) into the previous header.
    const lines = raw.split(/\r?\n/);
    const folded: string[] = [];
    for (const line of lines) {
      if (/^[ \t]/.test(line) && folded.length) folded[folded.length - 1] += " " + line.trim();
      else if (line.length) folded.push(line);
    }
    const get = (name: string) => folded.find(l => l.toLowerCase().startsWith(name.toLowerCase() + ":"));
    const headerValue = (name: string) => {
      const line = get(name);
      if (!line) return "—";
      return line.slice(name.length + 1).trim();
    };
    const received = folded.filter(l => /^received\s*:/i.test(l));
    const authResults = headerValue("Authentication-Results");
    const spfMatch = authResults.match(/\bspf=(\w+)/i)?.[1] ?? "—";
    const dkimMatch = authResults.match(/\bdkim=(\w+)/i)?.[1] ?? "—";
    const dmarcMatch = authResults.match(/\bdmarc=(\w+)/i)?.[1] ?? "—";
    const fromIp = received[0]?.match(/\[(\d{1,3}(?:\.\d{1,3}){3})\]/)?.[1] ?? "—";
    return {
      title: "Email header parsed",
      metrics: [
        ["From", headerValue("From")],
        ["To", headerValue("To")],
        ["Subject", headerValue("Subject")],
        ["Date", headerValue("Date")],
        ["SPF", spfMatch],
        ["DKIM", dkimMatch],
        ["DMARC", dmarcMatch],
        ["Originating IP", fromIp],
      ],
      columns: ["Field", "Value"],
      rows: [
        ["From", headerValue("From")],
        ["To", headerValue("To")],
        ["Subject", headerValue("Subject")],
        ["Date", headerValue("Date")],
        ["Message-ID", headerValue("Message-ID")],
        ["Return-Path", headerValue("Return-Path")],
        ["SPF", spfMatch],
        ["DKIM", dkimMatch],
        ["DMARC", dmarcMatch],
        ["Originating IP", fromIp],
        ["Hops", String(received.length)],
        ["Parsed in", "Browser · not sent anywhere"],
      ],
    };
  }
  throw new Error("Unknown local utility");
}