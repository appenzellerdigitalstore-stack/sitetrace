// src/lib/legacy-redirect.ts
// Applies the legacy-URL redirect map at the edge, before the router runs.
//
// Why this exists: this site builds to a Cloudflare Pages `_worker.js` (SSR).
// When a worker is present, Cloudflare hands every request to the worker and
// the `_redirects` file is not consulted, so a `_redirects`-only fix silently
// does nothing. The rules are therefore enforced here, in server.ts, where
// they run before TanStack Start would emit its own 307 for trailing slashes.
//
// A 307 is a temporary move and Google treats it as such. A 301 is the correct
// signal for URLs that are permanently gone or permanently moved.

import { EXACT_REDIRECTS, WILDCARD_REDIRECTS } from "../generated/redirects";

/** Longest matching wildcard wins, so specific rules beat broad ones. */
function matchWildcard(pathname: string): string | undefined {
  let best: { target: string; length: number } | undefined;

  for (const [pattern, target] of WILDCARD_REDIRECTS) {
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

/**
 * Resolves the canonical destination for a legacy pathname.
 * Returns undefined when the request should be handled by the router.
 */
export function resolveRedirect(pathname: string): string | undefined {
  const exact = EXACT_REDIRECTS[pathname];
  if (exact && exact !== pathname) return exact;

  const wildcard = matchWildcard(pathname);
  if (wildcard) return wildcard;

  // Trailing-slash normalisation: /about/ -> /about.
  // TanStack Start answers these with a 307; we answer 301 first.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const trimmed = pathname.replace(/\/+$/, "") || "/";
    if (trimmed !== pathname) return trimmed;
  }

  return undefined;
}

/**
 * Returns a 301 Response when the path is legacy, otherwise undefined.
 * Query string is preserved so campaign tags survive the hop.
 */
export function legacyRedirectResponse(request: Request): Response | undefined {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return undefined;
  }

  const target = resolveRedirect(url.pathname);
  if (!target) return undefined;

  const location = target + url.search;
  return new Response(null, {
    status: 301,
    headers: {
      location,
      // Permanent, and cheap to cache at the edge.
      "cache-control": "public, max-age=3600",
    },
  });
}