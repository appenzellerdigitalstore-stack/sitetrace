import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, BookOpen, Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { MatrixRain } from "@/components/matrix-rain";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getBlogPost, blogPosts, renderMarkdown } from "@/lib/blog";

// A single route file handles both /blog (index) and /blog/$slug (post).
// Using an optional segment ($) lets one route file own both URLs.
export const Route = createFileRoute("/blog/$")({
  component: Blog,
  loader: ({ params }) => {
    const slug = params["_splat"] || params["slug"];
    if (!slug) return { post: null };
    const post = getBlogPost(slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "SiteTrace Blog — Notes from the network" }, { name: "description", content: "Tutorials for the diagnostics that only run in a real terminal." }] };
    return { meta: [
      { title: post["title"] + " — SiteTrace Blog" },
      { name: "description", content: post["description"] },
      { property: "og:title", content: post["title"] + " — SiteTrace Blog" },
      { property: "og:description", content: post["description"] },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
});

type OS = "windows" | "darwin" | "linux";
const OS_LABELS: Record<OS, string> = {
  windows: "Windows (PowerShell/CMD)",
  darwin: "macOS (Terminal)",
  linux: "Linux (bash)",
};

function detectOS(): OS {
  if (typeof navigator === "undefined") return "linux";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "darwin";
  return "linux";
}

function Blog() {
  const loaderData = Route.useLoaderData();
  const post = loaderData?.post;
  if (!post) return <BlogIndex />;
  return <BlogPost post={post} />;
}

function BlogIndex() {
  return <div className="site-page"><MatrixRain /><SiteHeader /><main className="shell blog-page">
    <div className="eyebrow"><BookOpen size={14} />Notes from the network</div>
    <h1>SiteTrace Blog<span className="brand-dot">.</span></h1>
    <p className="blog-intro">Tutorials for the diagnostics that only run in a real terminal. Why you'd use them, how to read the output, and what to look for when something looks wrong.</p>
    <div className="blog-grid">
      {blogPosts.map(post => <Link key={post.slug} to="/blog/$" params={{ _splat: post.slug }} className="blog-card">
        <div className="blog-card-meta"><span className="eyebrow">{post["category"]}</span><span>{post["readingTime"]}</span></div>
        <h3>{post["title"]}</h3>
        <p>{post["description"]}</p>
        <div className="blog-card-bottom"><span>Read the guide</span><ArrowUpRight /></div>
      </Link>)}
    </div>
    <div className="blog-empty-link">
      <Button variant="outline" asChild><Link to="/" hash="tools"><ArrowLeft />Back to the tools</Link></Button>
    </div>
  </main></div>;
}

function BlogPost({ post }: { post: ReturnType<typeof getBlogPost> }) {
  const [selectedOS, setSelectedOS] = useState<OS>(detectOS());
  const [showSample, setShowSample] = useState(false);
  const [copied, setCopied] = useState(false);
  const html = renderMarkdown(post!["content"]);
  const commandText = post!["command"][selectedOS] || "";

  const copyCommand = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setShowSample((e.target as HTMLDetailsElement).open);
  };

  return (
    <div className="site-page">
      <MatrixRain />
      <SiteHeader />
      <main className="shell blog-post-page">
        <nav aria-label="Breadcrumb" className="tool-breadcrumb">
          <Link to="/blog/$">Blog</Link>
          <span className="breadcrumb-sep">›</span>
          <span>{post!["title"]}</span>
        </nav>
        <header className="blog-post-header">
          <div className="eyebrow"><BookOpen size={14} />{post!["category"]} · {post!["readingTime"]}</div>
          <h1>{post!["title"]}<span className="brand-dot">.</span></h1>
          <p className="blog-post-description">{post!["description"]}</p>
        </header>
        <article className="blog-post-content" dangerouslySetInnerHTML={{ __html: html }} />
        <section className="blog-interactive">
          <h2>Try it yourself<span className="brand-dot">.</span></h2>
          <p className="blog-interactive-subtitle">The browser can't run this — copy the command and paste it in your terminal.</p>
          <div className="command-block">
            <div className="command-block-head">
              <Terminal size={14} />
              <span>{OS_LABELS[selectedOS]}</span>
              <select className="command-os-picker" value={selectedOS} onChange={(e) => setSelectedOS(e.target.value as OS)} aria-label="Select operating system">
                <option value="windows">Windows</option>
                <option value="darwin">macOS</option>
                <option value="linux">Linux</option>
              </select>
              <Button variant="glossy" size="sm" onClick={() => void copyCommand(commandText)} title="Copy command" aria-label="Copy command">
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy command</>}
              </Button>
            </div>
            <code className="command-block-body">{commandText}</code>
          </div>
          <details className="command-sample" onToggle={handleToggle}>
            <summary>What you'll see when you run it</summary>
            <pre className="command-sample-body">{post!["command"]["sampleOutput"]}</pre>
          </details>
          {post!["walkthrough"].length > 0 && showSample && (
            <div className="walkthrough">
              <h3>What you're seeing<span className="brand-dot">.</span></h3>
              <ol className="walkthrough-list">
                {post!["walkthrough"].map((step, i) => (
                  <li key={i}>
                    <code className="walkthrough-line">{step["line"]}</code>
                    <p className="walkthrough-explanation">{step["explanation"]}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
        <footer className="blog-post-footer">
          <div className="blog-related">
            <h2>More from the blog</h2>
            <div className="blog-related-grid">
              {blogPosts.filter(p => p.slug !== post!.slug).slice(0, 3).map(p => (
                <Link key={p.slug} to="/blog/$" params={{ _splat: p.slug }} className="blog-related-card">
                  <span className="eyebrow">{p["category"]}</span>
                  <h4>{p["title"]}</h4>
                  <p>{p["description"]}</p>
                  <span className="blog-related-link">Read guide <ArrowUpRight size={14} /></span>
                </Link>
              ))}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/blog/$"><ArrowLeft /> Back to all posts</Link>
          </Button>
        </footer>
      </main>
    </div>
  );
}
