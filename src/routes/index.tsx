import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { ArrowRight, ArrowUpRight, ArrowDown, Terminal, Search, ShieldCheck, Zap, Check, Globe, LockKeyhole, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MatrixRain } from "@/components/matrix-rain";
import { SiteHeader, BrandMark } from "@/components/site-header";
import { categories, tools, getToolSlug } from "@/lib/tools";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [
    { title: "SiteTrace — Clarity in every connection" },
    { name: "description", content: "Trace an IP, resolve a domain, understand your network. Discover 21 focused internet diagnostic tools with SiteTrace." },
    { property: "og:title", content: "SiteTrace — Clarity in every connection" },
    { property: "og:description", content: "Your network. No guesswork. Discover a clearer view of the internet with 21 focused diagnostic tools." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

function Brand() { return <a href="#" className="brand" aria-label="SiteTrace home"><span className="brand-mark"><BrandMark /></span><span>SiteTrace<span className="brand-dot">.</span></span></a>; }

function Index() {
  const [category, setCategory] = useState("All tools");
  const [query, setQuery] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => tools.filter(tool => (category === "All tools" || tool.category === category) && `${tool.name} ${tool.description}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); document.getElementById("tools")?.scrollIntoView(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  return (
    <div className="site-page">
      <MatrixRain />
      <SiteHeader onQuickOpen={() => setQuickOpen(true)} />
      <main>
        <section className="hero">
          <div className="shell hero-content reveal">
            <div className="eyebrow hero-eyebrow"><span className="status-dot" />The internet, under the surface<ArrowUpRight size={11} /></div>
            <h1>Clarity in every<br /><span>connection.</span></h1>
            <p className="hero-copy">Trace an IP. Resolve a domain. Understand your network.<br />Precision tools for a connected world. No noise. Just answers.</p>
            <div className="hero-actions"><Button variant="glossy" asChild><a href="#tools">Explore the tools<ArrowRight /></a></Button><Button variant="outline" onClick={() => setQuickOpen(true)}><Terminal />Quick lookup<span className="text-muted-foreground">↗</span></Button></div>
            <div className="hero-assurances"><span><Zap />Built for speed</span><span><ShieldCheck />Privacy first</span><span><Check />Free to explore</span></div>
            <div className="terminal" aria-label="Illustrative network diagnostic example">
              <div className="terminal-bar"><span className="terminal-dot" /><span className="terminal-dot" /><span className="terminal-dot" /><span className="terminal-title">sitetrace — network diagnostics</span><span className="terminal-live"><span className="status-dot" />EXAMPLE</span></div>
              <div className="terminal-body"><div className="terminal-command"><span>❯</span>sitetrace lookup 8.8.8.8</div><div className="terminal-result"><span>IP address</span><span>8.8.8.8</span></div><div className="terminal-result"><span>Organization</span><span>Google LLC</span></div><div className="terminal-result"><span>Network</span><span>AS15169 · United States</span></div><div className="terminal-result"><span>Status</span><b>✓ Connection resolved</b></div><div className="mt-2 text-primary">❯ <span className="cursor" /></div></div>
            </div>
            <a href="#tools" className="hero-bottom">Less guessing. More knowing.<ArrowDown /></a>
          </div>
        </section>
        <section className="shell directory" id="tools">
          <div className="section-heading"><div><div className="eyebrow"><Terminal size={12} />The diagnostic toolkit</div><h2>Your network. No guesswork.</h2><p>Small tools. Clear answers. Everything you need to look a little deeper.</p></div><div className="tool-count"><span>21 tools</span> / one workspace</div></div>
          <div className="directory-controls"><div className="category-tabs" aria-label="Tool categories">{categories.map(item => <Button key={item} variant="ghost" className="filter-button" data-active={category === item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</Button>)}</div><label className="search-box"><Search /><input ref={searchRef} aria-label="Search tools" placeholder="Find a tool..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></label></div>
          <span className="sr-only" role="status">{filtered.length} tools found</span>
          {categories.slice(1).map(group => {
            const items = filtered.filter(tool => tool.category === group);
            if (!items.length) return null;
            return <section className="category-section" key={group}><div className="category-heading"><h3>{group}</h3><div className="category-line" /><span>{items.length} tools</span></div><div className="tool-grid">{items.map(tool => <Button key={tool.name} variant="tool" asChild><Link to="/tools/$slug" params={{ slug: getToolSlug(tool) }}><div className="tool-card-top"><span className="tool-icon"><tool.icon /></span><span className="tool-command">$ {tool.label}</span></div><h4>{tool.name}</h4><p>{tool.description}</p><div className="tool-card-bottom"><span>{tool.category === "Utilities" ? "Open utility" : "Explore tool"}</span><ArrowUpRight /></div></Link></Button>)}</div></section>;
          })}
          {!filtered.length && <div className="empty-state"><p>No tools match “{query}”.</p><Button variant="outline" onClick={() => { setQuery(""); setCategory("All tools"); }}>Clear filters<X /></Button></div>}
        </section>
        <section id="about" className="about-band"><div className="shell about-inner"><div><div className="eyebrow">A little more clarity</div><h2>The internet is complex.<br />Your tools shouldn't be.</h2></div><div className="about-values"><div className="about-value"><Zap /><h3>Purposefully simple</h3><p>Focused tools. Nothing between you and the details.</p></div><div className="about-value"><LockKeyhole /><h3>Privacy by design</h3><p>No account required. Your curiosity stays yours.</p></div><div className="about-value"><Globe /><h3>Open to everyone</h3><p>For builders, problem solvers, and curious minds.</p></div></div></div></section>
      </main>
      <footer className="shell footer"><Brand /><p>A little clarity. A lot fewer questions.</p><span className="footer-meta">© {new Date().getFullYear()} SiteTrace · Stay curious</span></footer>
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}><DialogContent><DialogTitle>Find your next answer.</DialogTitle><DialogDescription>Search the SiteTrace toolkit.</DialogDescription><label className="search-box w-full"><Search /><input aria-label="Quick tool search" autoFocus placeholder="IP, DNS, security…" value={query} onChange={e => setQuery(e.target.value)} /></label><div className="max-h-72 overflow-y-auto">{filtered.map(tool => <Button key={tool.name} variant="ghost" className="w-full justify-start" asChild><Link to="/tools/$slug" params={{ slug: getToolSlug(tool) }} onClick={() => setQuickOpen(false)}><tool.icon /><span>{tool.name}</span><ArrowUpRight className="ml-auto" /></Link></Button>)}{!filtered.length && <p className="modal-note">No matching tools.</p>}</div></DialogContent></Dialog>
    </div>
  );
}
