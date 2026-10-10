// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const OLD_TO_NEW = {
  "/downdetector": "/tools/is-it-down/",
  "/ip-lookup": "/tools/ip-lookup/",
  "/dns-tools": "/tools/dns-lookup/",
  "/headers-checker": "/tools/security-headers/",
  "/cert-checker": "/blog/ssl-certificate/",
  "/og-preview": "/tools/open-graph-preview/",
  "/what-is-my-ip": "/tools/what-is-my-ip/",
  "/ping": "/blog/ping/",
  "/is-it-down": "/tools/is-it-down/",
  "/website-down-checker": "/tools/bulk-url-status/",
  "/vpn-checker": "/tools/vpn-check/",
  "/subnet-calculator": "/tools/subnet-calculator/",
  "/email-deliverability": "/tools/email-deliverability/",
  "/seo-checker": "/tools/seo-checker/",
  "/http-headers": "/tools/http-headers/",
  "/privacy": "/tools/ip-lookup/",
  "/about": "/",
  "/home": "/",
  // Browser-can't-do tools moved to blog (Oct 2026).
  "/tools/traceroute": "/blog/traceroute/",
  "/tools/ping-test": "/blog/ping-test/",
  "/tools/port-check": "/blog/port-check/",
  "/tools/ssl-certificate": "/blog/ssl-certificate/",
} as const;

const routeRules: Record<string, { redirect: string; statusCode: number }> = {};
for (const [oldPath, newPath] of Object.entries(OLD_TO_NEW)) {
  routeRules[oldPath] = { redirect: newPath, statusCode: 301 };
  routeRules[`${oldPath}/`] = { redirect: newPath, statusCode: 301 };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    // Override the default cloudflare-module preset to a Pages-deployable shape.
    // cloudflare-pages produces a _worker.js at the output root + a public/ folder,
    // which Cloudflare Pages serves as a Pages Function (SSR) over static assets.
    preset: "cloudflare-pages",
    // Compile the old-sitetrace URL redirects into the Function itself.
    // Cloudflare's _worker.js takes priority over functions/_middleware.js, and
    // Nitro's cloudflare-pages preset wipes dist/_redirects to an empty file,
    // so routeRules is the only place these redirects reliably live.
    routeRules,
  },
});
