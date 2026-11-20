import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatrixRain } from "@/components/matrix-rain";
import { SiteHeader } from "@/components/site-header";
import { getToolSlug, tools, categories } from "@/lib/tools";

export const Route = createFileRoute("/tools/")({
  head: () => ({ meta: [
    { title: "All SiteTrace tools — network, DNS, HTTP, email and SEO diagnostics" },
    { name: "description", content: "The full SiteTrace toolkit: IP and network ownership, DNS resolution and propagation, HTTP status, headers and latency, SPF, DKIM and DMARC, security headers, SEO and Open Graph checks, and small utilities that run entirely in your browser." },
    { property: "og:title", content: "All SiteTrace tools" },
    { property: "og:description", content: "Network, DNS, HTTP, email and SEO diagnostics that run free in your browser." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ToolsIndexPage,
});

const CATEGORY_INTROS: Record<string, string> = {
  "Network & IP": "Who owns the address you connect from, which network it belongs to, whether a blocklist lists it, and whether a VPN or proxy sits in front of it. These checks read network registration data, so treat the location as an estimate of the network rather than of the person using it.",
  "DNS & connectivity": "What a domain resolves to, who is authoritative for it, and whether a recent change has reached resolvers around the world. Use these before blaming a browser, a certificate or a cache for a site that will not load.",
  "Web & security": "Whether a site answers at all, how fast it answers once it does, which headers it returns, and which of the standard security headers are missing. Run the status check first, then read the headers, then decide what is actually broken.",
  "Email & certificates": "The records that decide whether mail reaches the inbox and whether a TLS certificate is valid and current. SPF, DKIM and DMARC are read straight from DNS, and the header parser traces the path a delivered message actually took.",
  "SEO & preview": "The metadata that decides how a page appears in search results and when it is shared on a social network. Titles, descriptions, canonical tags, robots directives and Open Graph tags all live in the page head.",
  "Utilities": "Small tools that solve one problem each: generating a password worth storing, picking a colour, counting words, or working out which diagnostic a given URL or IP actually needs. These run in your browser and send nothing anywhere.",
};

function ToolsIndexPage() {
  const grouped = categories
    .filter(name => name !== "All tools")
    .map(name => ({ name, items: tools.filter(tool => tool.category === name) }))
    .filter(group => group.items.length > 0);

  return <div className="site-page"><MatrixRain /><SiteHeader /><main className="shell tool-page">
    <nav aria-label="Breadcrumb" className="tool-breadcrumb"><Link to="/">SiteTrace</Link><ChevronRight size={12} /><span>All tools</span></nav>
    <div className="workspace-heading"><div>
      <div className="eyebrow">The toolkit</div>
      <h1>All tools<span className="brand-dot">.</span></h1>
      <p>SiteTrace bundles the diagnostics a small team would otherwise assemble one at a time: network ownership, DNS, HTTP behaviour, mail authentication, and the metadata that shapes how a page looks when it is shared. Every tool is free, runs in your browser where it can, and shows you the command you would run yourself when it cannot.</p>
    </div></div>

    {grouped.map(group => <section key={group.name} className="tools-index-group">
      <div className="tools-index-intro">
        <h2>{group.name}</h2>
        <p>{CATEGORY_INTROS[group.name] ?? `The ${group.name.toLowerCase()} diagnostics in the SiteTrace toolkit.`}</p>
      </div>
      <div className="tool-grid">{group.items.map(item => <Button variant="tool" key={item.name} asChild><Link to="/tools/$slug" params={{ slug: getToolSlug(item) }}><div className="tool-card-top"><span className="tool-icon"><item.icon /></span><span className="tool-command">$ {item.label}</span></div><h4>{item.name}</h4><p>{item.description}</p><div className="tool-card-bottom"><span>Open tool</span><ArrowUpRight /></div></Link></Button>)}</div>
    </section>)}
  </main></div>;
}
