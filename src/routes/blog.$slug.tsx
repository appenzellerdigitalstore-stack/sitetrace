import { createFileRoute, notFound } from "@tanstack/react-router";
import { BlogGuide } from "@/components/blog-guide";
import { guides } from "@/lib/blog-guides";
import { tools, getToolSlug } from "@/lib/tools";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    // Some guides (ping-test, traceroute, port-check, ssl-certificate) exist
    // for tools that were removed from /tools because the browser can't run
    // them. Show the guide anyway and let BlogGuide degrade gracefully
    // (no "Open X" CTA, breadcrumb uses the slug as the name).
    const tool = tools.find(item => getToolSlug(item) === params.slug);
    const guide = guides[params.slug];
    if (!guide) throw notFound();
    const name = tool ? tool.name : params.slug.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    return { slug: params.slug, name, summary: guide.summary };
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.name}: Results & Mac/Windows Guide — SiteTrace` : "Guide not found — SiteTrace" },
    { name: "description", content: loaderData?.summary ?? "This SiteTrace guide could not be found." },
    { property: "og:title", content: loaderData ? `A simple guide to ${loaderData.name} — SiteTrace` : "Guide not found — SiteTrace" },
    { property: "og:description", content: loaderData?.summary ?? "Explore SiteTrace tool guides." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(!loaderData ? [{ name: "robots", content: "noindex" }] : []),
  ] }),
  component: GuidePage,
});

function GuidePage() {
  const { slug } = Route.useLoaderData();
  return <BlogGuide key={slug} slug={slug} />;
}