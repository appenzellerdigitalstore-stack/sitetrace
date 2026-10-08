// Cloudflare Pages Function: redirect old sitetrace URLs to the new
// TanStack Start routes. Runs before any other Function, including
// dist/_worker.js (the SSR Function).
//
// The dist/_redirects file is unreliable because Nitro's cloudflare-pages
// preset overwrites it with an empty file during the build.

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
  "/privacy/": "/tools/ip-lookup/",
  "/about/": "/",
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
