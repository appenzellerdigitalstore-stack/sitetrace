/**
 * Canonical URL injection.
 *
 * Every page needs a self-referencing canonical link. Without one, Google
 * reports "Duplicate without user-selected canonical" and has to guess which
 * of several identical addresses is the real one.
 *
 * It is injected in the server entry rather than in each route's head(),
 * because the server adds it to whatever it is about to send. No route can
 * be forgotten, and no page can ship without one.
 */

/** The one address this site is published at. */
export const SITE_ORIGIN = "https://sitetrace.it.com";

const CANONICAL_TAG = /<link[^>]*\brel\s*=\s*["']?canonical["']?[^>]*>/i;

/**
 * The canonical form of a path: absolute, on the published origin, with no
 * query string, no fragment and no trailing slash.
 *
 * The query string is dropped on purpose. A campaign parameter does not
 * make a different page, and letting it through is exactly what creates
 * duplicates.
 */
export function canonicalUrl(pathname: string): string {
  let path = pathname.replace(/\/+$/, "");
  if (path === "") path = "/";
  return `${SITE_ORIGIN}${path}`;
}

/** Adds a canonical link to a document, unless it already has one. */
export function injectCanonical(html: string, href: string): string {
  if (CANONICAL_TAG.test(html)) return html;
  const tag = `<link rel="canonical" href="${href}" />`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => match + tag);
  }
  return html.replace(/<html[^>]*>/i, (match) => `${match}<head>${tag}</head>`);
}

/**
 * Returns the response with a canonical link added.
 *
 * Only real HTML documents are touched: a JSON response, a redirect or a
 * compressed body is left exactly as it was.
 */
export async function withCanonical(response: Response, request: Request): Promise<Response> {
  if (response.status !== 200) return response;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;

  // A compressed body cannot be edited without decompressing it first.
  const encoding = (response.headers.get("content-encoding") ?? "").toLowerCase();
  if (encoding && encoding !== "identity") return response;

  const html = await response.text();
  const next = injectCanonical(html, canonicalUrl(new URL(request.url).pathname));
  if (next === html) return response;

  const headers = new Headers(response.headers);
  headers.set("content-length", String(new TextEncoder().encode(next).byteLength));
  return new Response(next, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
