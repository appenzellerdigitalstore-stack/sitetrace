// ARCHIVED 2026-10-22 — restored by moving back to functions/_middleware.js
//
// This Pages Function duplicated the legacy-URL redirect map that now lives in
// _redirects -> src/generated/redirects.ts -> src/lib/legacy-redirect.ts.
//
// It went stale: it still mapped
//   /privacy/ -> /tools/ip-lookup/
//   /about/   -> /
// which sent Google's crawler away from the real privacy and about pages.
// That is exactly the problem the redirect work was meant to fix.
//
// Kept for reference only. Do not restore it. If you need to change a
// redirect, edit the root _redirects file and run:
//   node scripts/generate-redirects.mjs
// then verify with:
//   node scripts/check-redirect-logic.mjs

const REDIRECTS = {
  "/downdetector": "/tools/is-it-down/",
  "/downdetector/": "/tools/is-it-down/",
  "/ip-lookup/": "/tools/ip-lookup/",
  "/ip-lookup": "/tools/ip-lookup/",
  "/dns-tools/": "/tools/dns-lookup/",
  "/dns-tools": "/tools/dns-lookup/",
  "/headers-checker/": "/tools/security-headers/",
  "/headers-checker": "/tools/security-headers/",
  "/cert-checker/": "/tools/ssl-certificate/",
  "/cert-checker": "/tools/ssl-certificate/",
  "/og-preview/": "/tools/open-graph-preview/",
  "/og-preview": "/tools/open-graph-preview/",
  "/what-is-my-ip/": "/tools/what-is-my-ip/",
  "/what-is-my-ip": "/tools/what-is-my-ip/",
  "/ping/": "/tools/ping-test/",
  "/ping": "/tools/ping-test/",
  "/is-it-down/": "/tools/is-it-down/",
  "/is-it-down": "/tools/is-it-down/",
  "/website-down-checker/": "/tools/bulk-url-status/",
  "/website-down-checker": "/tools/bulk-url-status/",
  "/vpn-checker/": "/tools/vpn-check/",
  "/vpn-checker": "/tools/vpn-check/",
  "/subnet-calculator/": "/tools/subnet-calculator/",
  "/subnet-calculator": "/tools/subnet-calculator/",
  "/email-deliverability/": "/tools/email-deliverability/",
  "/email-deliverability": "/tools/email-deliverability/",
  "/seo-checker/": "/tools/seo-checker/",
  "/seo-checker": "/tools/seo-checker/",
  "/http-headers/": "/tools/http-headers/",
  "/http-headers": "/tools/http-headers/",
  "/privacy/": "/tools/ip-lookup/", // stale: blocked the real privacy page
  "/about/": "/", // stale: blocked the real about page
  "/home": "/",
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const destination = REDIRECTS[url.pathname];
  if (destination) {
    const target = new URL(destination, url);
    return Response.redirect(target, 301);
  }
  return context.next();
}