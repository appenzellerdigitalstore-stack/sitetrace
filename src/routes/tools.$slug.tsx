import { createFileRoute, notFound } from "@tanstack/react-router";
import { tools, getToolSlug } from "@/lib/tools";
import { ToolWorkspace } from "@/components/tool-workspace";

export const Route = createFileRoute("/tools/$slug")({
  loader: ({ params }) => {
    const tool = tools.find(item => getToolSlug(item) === params.slug);
    if (!tool) throw notFound();
    return { slug: getToolSlug(tool), name: tool.name, description: tool.description };
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.name} — SiteTrace` : "Tool not found — SiteTrace" },
    { name: "description", content: loaderData?.description ?? "This SiteTrace tool could not be found." },
    { property: "og:title", content: loaderData ? `${loaderData.name} — SiteTrace` : "Tool not found — SiteTrace" },
    { property: "og:description", content: loaderData?.description ?? "Explore the SiteTrace diagnostic toolkit." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    ...(!loaderData ? [{ name: "robots", content: "noindex" }] : []),
  ] }),
  component: ToolPage,
});

function ToolPage() {
  const { slug } = Route.useLoaderData();
  const tool = tools.find(item => getToolSlug(item) === slug);
  if (!tool) return null;
  return <ToolWorkspace key={slug} tool={tool} />;
}