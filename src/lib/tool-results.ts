import { workspaces, type ToolResult } from "./tool-workspaces";

// Live diagnostic integration boundary: replace this function for remote checks.
// These responses deliberately remain fixed fixtures, never inferred live data.
export function getDiagnosticSample(slug: string): ToolResult {
  const workspace = workspaces[slug];
  if (!workspace) throw new Error("Unknown diagnostic");
  return structuredClone(workspace.sample);
}

export async function runLocalUtility(slug: string, values: Record<string, string>): Promise<ToolResult> {
  const text = values["target"] ?? "";
  if (slug === "what-is-my-ip") {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) throw new Error("Could not detect your network right now. Try again in a moment.");
    const data = await response.json() as { ip?: string; city?: string; region?: string; country_name?: string; country_code?: string; org?: string; timezone?: string; latitude?: number; longitude?: number; error?: boolean; reason?: string };
    if (data.error) throw new Error(data.reason ?? "IP lookup service returned an error.");
    const ip = data.ip ?? "Unknown";
    return {
      title: "Your network",
      metrics: [["Public IP", ip], ["Country", data.country_name ? `${data.country_name} (${data.country_code ?? "?"})` : "Unknown"], ["City", data.city ?? "Unknown"], ["Region", data.region ?? "Unknown"], ["ISP", data.org ?? "Unknown"], ["Timezone", data.timezone ?? "Unknown"]],
      columns: ["Property", "Value"],
      rows: [
        ["Latitude", data.latitude !== undefined ? String(data.latitude) : "Unknown"],
        ["Longitude", data.longitude !== undefined ? String(data.longitude) : "Unknown"],
        ["Source", "ipapi.co · live detection"],
        ["Cached", "Not stored"],
      ],
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
    return { title: "Target classification", metrics: [["Target", hostname], ["Type", isUrl ? "Website URL" : isIp ? "IP address" : "Domain"], ["Protocol", isUrl ? new URL(target).protocol.replace(":", "").toUpperCase() : "—"]], columns: ["Suggested tool", "Purpose"], rows: isIp ? [["IP lookup", "Location and network ownership"], ["IP reputation", "Blocklist signals"], ["VPN check", "Connection classification"]] : isUrl ? [["HTTP headers", "Inspect response headers"], ["Security headers", "Audit website protection"], ["SEO checker", "Inspect page metadata"]] : [["DNS lookup", "Resolve domain records"], ["DNS propagation", "Compare global answers"], ["SSL certificate", "Inspect certificate validity"]] };
  }
  throw new Error("Unknown local utility");
}