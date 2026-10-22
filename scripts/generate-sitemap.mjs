// scripts/generate-sitemap.mjs
// Build-time sitemap generator for sitetrace.it.com.
// Includes: /, /blog/, /blog/<slug> for all 22 guides, /tools/<slug> for all 22 tools.
// Reads blog guide list from src/lib/blog-guides.ts (key list of slug strings).
// Reads tool list from src/lib/tools.ts.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SITE_CONFIG = {
  base: "https://sitetrace.it.com",
  changefreq: { home: "weekly", blog: "monthly", tool: "monthly" },
  priority: { home: "1.0", blog: "0.8", tool: "0.7" },
};

// 22 blog guide slugs (4 orphans + 18 in index)
const blogSlugs = [
  "bulk-url-status", "dns-lookup", "dns-propagation", "email-deliverability",
  "http-headers", "ip-lookup", "ip-reputation", "is-it-down", "open-graph-preview",
  "password-generator", "random-color", "security-headers", "seo-checker",
  "smart-dispatcher", "subnet-calculator", "vpn-check", "what-is-my-ip", "word-counter",
  // 4 orphan guides (not in /blog/ index but exist as direct URLs)
  "ping-test", "traceroute", "port-check", "ssl-certificate",
];

// 22 tool slugs (18 with guides + 4 without)
const toolSlugs = [
  "bulk-url-status", "dns-lookup", "dns-propagation", "email-deliverability",
  "http-headers", "ip-lookup", "ip-reputation", "is-it-down", "open-graph-preview",
  "password-generator", "random-color", "security-headers", "seo-checker",
  "smart-dispatcher", "subnet-calculator", "vpn-check", "what-is-my-ip", "word-counter",
  // 4 tools without blog guides
  "whois-lookup", "http-latency", "email-header-parser", "jwt-decoder",
];

const today = new Date().toISOString().split("T")[0];

// Static site pages (real SSR routes). Legal + about pages are required for
// AdSense review and were previously missing from the sitemap entirely.
const staticPages = [
  { loc: "/about", priority: "0.7", changefreq: "monthly", lastmod: today },
  { loc: "/privacy", priority: "0.5", changefreq: "yearly", lastmod: today },
  { loc: "/terms", priority: "0.5", changefreq: "yearly", lastmod: today },
  { loc: "/tools", priority: "0.9", changefreq: "weekly", lastmod: today },
];

const urls = [
  { loc: SITE_CONFIG.base + "/", priority: SITE_CONFIG.priority.home, changefreq: SITE_CONFIG.changefreq.home, lastmod: today },
  { loc: SITE_CONFIG.base + "/blog", priority: "0.9", changefreq: SITE_CONFIG.changefreq.blog, lastmod: today },
  ...staticPages.map(p => ({ loc: SITE_CONFIG.base + p.loc, priority: p.priority, changefreq: p.changefreq, lastmod: p.lastmod })),
  ...blogSlugs.map(s => ({ loc: `${SITE_CONFIG.base}/blog/${s}`, priority: SITE_CONFIG.priority.blog, changefreq: SITE_CONFIG.changefreq.blog })),
  ...toolSlugs.map(s => ({ loc: `${SITE_CONFIG.base}/tools/${s}`, priority: SITE_CONFIG.priority.tool, changefreq: SITE_CONFIG.changefreq.tool })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

const out = resolve(ROOT, "public", "sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(`OK: wrote ${urls.length} URLs to ${out} (1 home + 1 blog index + ${staticPages.length} static + ${blogSlugs.length} guides + ${toolSlugs.length} tools)`);
