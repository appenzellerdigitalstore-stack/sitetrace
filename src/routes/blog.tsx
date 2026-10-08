import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { MatrixRain } from "@/components/matrix-rain";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/blog")({
  component: Blog,
  head: () => ({ meta: [
    { title: "SiteTrace Blog — Notes from the network" },
    { name: "description", content: "The SiteTrace blog. Notes on networks, domains, and web security." },
    { property: "og:title", content: "SiteTrace Blog — Notes from the network" },
    { property: "og:description", content: "Notes on networks, domains, and web security from SiteTrace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

function Blog() {
  return <div className="site-page"><MatrixRain /><SiteHeader /><main className="shell blog-page">
    <div className="eyebrow"><BookOpen size={14} />Notes from the network</div>
    <h1>SiteTrace Blog<span className="brand-dot">.</span></h1>
    <div className="blog-empty"><BookOpen size={28} /><h2>No posts yet.</h2><p>Check back for new posts.</p><Button variant="outline" asChild><Link to="/" hash="tools"><ArrowLeft />Explore the tools</Link></Button></div>
  </main></div>;
}