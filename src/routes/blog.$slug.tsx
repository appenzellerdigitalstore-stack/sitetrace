import { createFileRoute, notFound } from "@tanstack/react-router";
import { BlogGuide } from "@/components/blog-guide";
import { guides } from "@/lib/blog-guides";
import { tools, getToolSlug } from "@/lib/tools";

// Slug aliases: when a guide was renamed (e.g. ping → ping-test), the old
// slug should still resolve. Without this, /blog/ping 404s and any old
// inbound links die. Add entries here as guides are renamed.
const ALIASES: Record<string, string> = {
  "ping": "ping-test",
};

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    // Some guides (ping-test, traceroute, port-check, ssl-certificate) exist
    // for tools that were removed from /tools because the browser can't run
    // them. Show the guide anyway and let BlogGuide degrade gracefully
    // (no "Open X" CTA, breadcrumb uses the slug as the name).
    const requested = params.slug;
    const slug = ALIASES[requested] ?? requested;
    // Validate the slug exists in guides (after alias resolution) before
    // rendering. 404 if neither the requested nor aliased slug exists.
    if (!guides[slug]) throw notFound();
    return { slug };
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `A simple guide to ${loaderData.slug} — SiteTrace` : "Guide not found — SiteTrace" },
    { name: "description", content: loaderData ? guides[loaderData.slug]?.summary ?? "" : "This SiteTrace guide could not be found." },
    { property: "og:title", content: loaderData ? `A simple guide to ${loaderData.slug} — SiteTrace` : "Guide not found — SiteTrace" },
    { property: "og:description", content: loaderData ? guides[loaderData.slug]?.summary ?? "" : "Explore SiteTrace tool guides." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
  ] }),
  component: BlogGuideRoute,
});

function BlogGuideRoute() {
  const { slug } = Route.useLoaderData();
  return <BlogGuide slug={slug} />;
}
