import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { MatrixRain } from "@/components/matrix-rain";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/blog";

export const Route = createFileRoute("/blog/")({
  component: Blog,
  head: () => ({ meta: [
    { title: "SiteTrace Blog — Notes from the network" },
    { name: "description", content: "Network diagnostics tutorials. Traceroute, ping, port checks, SSL inspection — what to look for and what the output means." },
    { property: "og:title", content: "SiteTrace Blog — Notes from the network" },
    { property: "og:description", content: "Tutorials for the diagnostics that only run in a real terminal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

function Blog() {
  return <div className="site-page"><MatrixRain /><SiteHeader /><main className="shell blog-page">
    <div className="eyebrow"><BookOpen size={14} />Notes from the network</div>
    <h1>SiteTrace Blog<span className="brand-dot">.</span></h1>
    <p className="blog-intro">Tutorials for the diagnostics that only run in a real terminal. Why you'd use them, how to read the output, and what to look for when something looks wrong.</p>
    <div className="blog-grid">
      {blogPosts.map(post => <Link key={post.slug} to="/blog/$slug" params={{ slug: post.slug }} className="blog-card">
        <div className="blog-card-meta"><span className="eyebrow">{post.category}</span><span>{post.readingTime}</span></div>
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <div className="blog-card-bottom"><span>Read the guide</span><ArrowUpRight /></div>
      </Link>)}
    </div>
    <div className="blog-empty-link">
      <Button variant="outline" asChild><Link to="/" hash="tools"><ArrowLeft />Back to the tools</Link></Button>
    </div>
  </main></div>;
}