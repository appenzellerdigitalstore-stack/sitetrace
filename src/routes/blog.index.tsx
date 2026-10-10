import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Search, X } from "lucide-react";
import { MatrixRain } from "@/components/matrix-rain";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { tools, categories, getToolSlug } from "@/lib/tools";
import { guides } from "@/lib/blog-guides";

export const Route = createFileRoute("/blog/")({
  component: Blog,
  head: () => ({ meta: [
    { title: "SiteTrace Blog — Simple Guides for Every Tool" },
    { name: "description", content: "Learn all SiteTrace tools with example screenshots, plain-language result explanations, and Mac and Windows instructions." },
    { property: "og:title", content: "SiteTrace Blog — Simple Guides for Every Tool" },
    { property: "og:description", content: "Understand network, DNS, security, and utility results with simple illustrated guides for Mac and Windows." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

function Blog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const filtered = useMemo(() => {
    return tools.filter(tool => {
      const slug = getToolSlug(tool);
      if (!guides[slug]) return false; // only show tools that have a guide
      const matchesCategory = category === "All tools" || category === tool.category;
      const matchesQuery = `${tool.name} ${guides[slug]?.summary ?? ""}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);
  return <div className="site-page"><MatrixRain /><SiteHeader /><main className="shell blog-page">
    <header className="blog-intro"><div className="eyebrow">Notes from the network</div><h1>SiteTrace Blog<span className="brand-dot">.</span></h1><p>Simple guides to every tool. See an example, understand the results, and try it on your Mac or Windows PC.</p></header>
    <div className="directory-controls blog-controls"><div className="category-tabs" aria-label="Guide categories">{categories.map(item => <Button variant="ghost" className="filter-button" key={item} data-active={category === item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === "All tools" ? "All guides" : item}</Button>)}</div><label className="search-box"><Search /><input aria-label="Search guides" placeholder="Find a guide…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <p className="blog-count" role="status">{filtered.length} {filtered.length === 1 ? "guide" : "guides"}</p>
    <div className="blog-grid">{filtered.map(tool => <Button variant="ghost" className="blog-card" asChild key={tool.name}><Link to="/blog/$slug" params={{ slug: getToolSlug(tool) }}><span className="blog-card-meta"><span>{tool.category}</span><span>5 min</span></span><h2>A simple guide to {tool.name.toLowerCase()}</h2><p>{guides[getToolSlug(tool)]?.summary}</p><span className="blog-card-bottom">Read the guide<ArrowUpRight size={18} /></span></Link></Button>)}</div>
    {!filtered.length && <div className="empty-state"><p>No guides match "{query}".</p><Button variant="outline" onClick={() => { setQuery(""); setCategory("All tools"); }}>Clear filters<X /></Button></div>}
  </main></div>;
}
