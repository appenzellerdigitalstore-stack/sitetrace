// scripts/check-redirect-logic.mjs
// Fast sanity check for the generated redirect map + matcher.
// Run: node scripts/check-redirect-logic.mjs
// Exits non-zero if any expectation fails.

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ts = readFileSync(resolve(ROOT, "src", "generated", "redirects.ts"), "utf8");

const EXACT = Object.fromEntries(
  [...ts.matchAll(/^\s*"([^"]+)": "([^"]+)",$/gm)].map((m) => [m[1], m[2]]),
);
const WILDCARDS = [...ts.matchAll(/^\s*\["([^"]+)", "([^"]+)"\],$/gm)].map((m) => [m[1], m[2]]);

function matchWildcard(pathname) {
  let best;
  for (const [pattern, target] of WILDCARDS) {
    const star = pattern.indexOf("*");
    const prefix = pattern.slice(0, star);
    const suffix = pattern.slice(star + 1);
    if (!pathname.startsWith(prefix)) continue;
    if (!pathname.endsWith(suffix)) continue;
    if (pathname.length < prefix.length + suffix.length) continue;
    const captured = pathname.slice(prefix.length, pathname.length - suffix.length);
    const resolved = target.replace("*", captured);
    if (resolved === pathname) continue;
    if (!best || prefix.length > best.length) best = { target: resolved, length: prefix.length };
  }
  return best?.target;
}

function resolveRedirect(pathname) {
  const exact = EXACT[pathname];
  if (exact && exact !== pathname) return exact;
  const wildcard = matchWildcard(pathname);
  if (wildcard) return wildcard;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const trimmed = pathname.replace(/\/+$/, "") || "/";
    if (trimmed !== pathname) return trimmed;
  }
  return undefined;
}

const cases = [
  // [pathname, expected, description]
  ["/downdetector", "/tools/is-it-down", "legacy tool page -> current route"],
  ["/ip-lookup", "/tools/ip-lookup", "legacy ip-lookup -> current route"],
  ["/seo-checker", "/tools/seo-checker", "legacy seo-checker"],
  ["/vs/alpha-vs-beta", "/blog", "comparison wildcard"],
  ["/home", "/", "retired /home"],
  ["/sponsor", "/about", "retired /sponsor -> about"],
  ["/tools/traceroute", "/blog/traceroute", "browser-only tool -> blog guide"],
  ["/tools/ssl-certificate", "/blog/ssl-certificate", "browser-only tool -> blog guide"],
  ["/privacy", undefined, "canonical privacy page is NOT redirected"],
  ["/about", undefined, "canonical about page is NOT redirected"],
  ["/terms", undefined, "canonical terms page is NOT redirected"],
  ["/privacy/", "/privacy", "privacy trailing slash -> canonical"],
  ["/about/", "/about", "about trailing slash -> canonical"],
  ["/terms/", "/terms", "terms trailing slash -> canonical"],
  ["/blog/", "/blog", "blog trailing slash -> canonical"],
  ["/tools/", "/tools", "tools index trailing slash"],
  ["/blog/dns-lookup", undefined, "live blog post untouched"],
  ["/tools/ip-lookup", undefined, "live tool page untouched"],
  ["/", undefined, "root untouched"],
  ["/assets/index-abc123.js", undefined, "hashed asset untouched"],
  ["/sitemap.xml", undefined, "sitemap untouched"],
  ["/robots.txt", undefined, "robots untouched"],
  ["/ads.txt", undefined, "ads.txt untouched"],
];

let failed = 0;
for (const [pathname, expected, why] of cases) {
  const actual = resolveRedirect(pathname);
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${pathname.padEnd(32)} -> ${String(actual).padEnd(20)} (expected ${String(expected)})  ${why}`,
  );
}

// Guard rails: no self-references, and every destination must be canonical.
for (const [from, to] of Object.entries(EXACT)) {
  if (from === to) {
    failed++;
    console.log(`FAIL  self-referencing rule: ${from}`);
  }
  if (to.length > 1 && to.endsWith("/")) {
    failed++;
    console.log(`FAIL  non-canonical destination: ${from} -> ${to}`);
  }
}

// Guard rail: there must be exactly one redirect map in the repo.
// A stale second copy previously sat in vite.config.ts (nitro.routeRules) and
// functions/_middleware.js, and it won over the correct one - it sent
// /privacy to /tools/ip-lookup/ and /about to /.
//
// Comments are stripped first so that *documenting* the old location (as
// vite.config.ts now does) does not trip the guard.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const duplicateSources = [
  ["vite.config.ts routeRules", resolve(ROOT, "vite.config.ts"), /\brouteRules\b/],
  ["functions/_middleware.js", resolve(ROOT, "functions", "_middleware.js"), /\bREDIRECTS\b/],
];
for (const [label, path, pattern] of duplicateSources) {
  if (!existsSync(path)) continue;
  if (!pattern.test(stripComments(readFileSync(path, "utf8")))) continue;
  failed++;
  console.log(`FAIL  duplicate redirect map still present: ${label} (${path})`);
}

// Guard rail: the legal pages must never be redirected away from themselves.
for (const page of ["/privacy", "/terms", "/about"]) {
  const target = EXACT[page];
  if (target) {
    failed++;
    console.log(`FAIL  legal page ${page} is redirected to ${target}`);
  }
}

console.log(
  `\n${failed === 0 ? "OK" : "FAILED"}: ${cases.length - failed}/${cases.length} cases, ` +
  `${Object.keys(EXACT).length} exact rules, ${WILDCARDS.length} wildcard rules`,
);
process.exit(failed === 0 ? 0 : 1);