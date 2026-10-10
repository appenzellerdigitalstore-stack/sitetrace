import { createFileRoute, notFound } from "@tanstack/react-router";
import { BlogGuide } from "@/components/blog-guide";
import { guides } from "@/lib/blog-guides";
import { tools, getToolSlug } from "@/lib/tools";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const tool = tools.find(item => getToolSlug(item) === params.slug);
    const guide = guides[params.slug];
    if (!tool || !guide) throw notFound();
    return { slug: params.slug, name: tool.name, summary: guide.summary };
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