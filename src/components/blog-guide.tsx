import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, Copy, Monitor, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatrixRain } from "@/components/matrix-rain";
import { SiteHeader } from "@/components/site-header";
import { guides } from "@/lib/blog-guides";
import { blogImages } from "@/lib/blog-images";
import { getToolSlug, tools } from "@/lib/tools";
import { workspaces } from "@/lib/tool-workspaces";

export function BlogGuide({ slug }: { slug: string }) {
  const [platform, setPlatform] = useState<"mac" | "windows">("mac");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const tool = tools.find(item => getToolSlug(item) === slug);
  const guide = guides[slug];
  if (!guide) return null;
  const toolName = tool ? tool.name : slug.split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const toolCategory = tool?.category ?? "Diagnostics";
  const toolExists = !!tool;
  const instructions = guide[platform];
  const related = tool ? tools.filter(item => item.category === tool.category && item.name !== tool.name).slice(0, 3) : [];
  return <div className="site-page"><MatrixRain /><SiteHeader /><main className="shell guide-page">
    <nav aria-label="Breadcrumb" className="tool-breadcrumb"><Link to="/blog">Blog</Link><ChevronRight size={12} /><span>{toolName}</span></nav>
    <article className="guide-surface">
      <header className="guide-header"><div className="eyebrow">{toolCategory} · 5 min read</div><h1>A simple guide to {toolName.toLowerCase()}<span className="brand-dot">.</span></h1><p>{guide.summary}</p>{toolExists ? <Button variant="glossy" asChild><Link to="/tools/$slug" params={{ slug }}>Open {toolName}<ArrowUpRight /></Link></Button> : null}</header>
      <section className="guide-section"><h2>What this tool tells you</h2><p>{guide.purpose}</p></section>
      <section className="guide-section"><h2>Try it in SiteTrace</h2><ol className="guide-steps">{guide.steps.map(step => <li key={step}>{step}</li>)}</ol><p className="guide-disclosure">{toolExists ? (workspaces[slug]?.local ? "This utility works locally in your browser. The screenshot shows one example result." : "The current tool shows fixed mockup data—not a live check of the address you enter. The screenshot below is an example, not a diagnosis.") : "There is no in-browser tool for this diagnostic — your computer or network has to perform it. The Mac and Windows commands below show how to run it yourself."}</p></section>
      {blogImages[slug] ? (
        <section className="guide-section"><h2>What your result looks like</h2><figure className="guide-figure"><a href={blogImages[slug]} target="_blank" rel="noreferrer" aria-label={`Open full-size ${toolName} example screenshot`}><img src={blogImages[slug]} alt={`${toolName} input settings and example results in SiteTrace`} width={1152} height={900} loading="lazy" /></a><figcaption>SiteTrace {toolName.toLowerCase()} · example output. Select the screenshot to view it at full size.</figcaption></figure></section>
      ) : null}
      <section className="guide-section"><h2>How to read the information</h2><dl className="guide-definitions">{guide.terms.map(term => <div key={term.label}><dt>{term.label}</dt><dd>{term.meaning}</dd></div>)}</dl><h3>What the example means</h3><p>{guide.takeaway}</p></section>
      <section className="guide-section"><h2>On your Mac or Windows PC</h2><div className="guide-platforms" role="group" aria-label="Choose your computer"><Button variant={platform === "mac" ? "secondary" : "ghost"} aria-pressed={platform === "mac"} onClick={() => { setPlatform("mac"); setCopied(false); setCopyError(""); }}><Terminal />Mac</Button><Button variant={platform === "windows" ? "secondary" : "ghost"} aria-pressed={platform === "windows"} onClick={() => { setPlatform("windows"); setCopied(false); setCopyError(""); }}><Monitor />Windows</Button></div><h3>{platform === "mac" ? "Mac" : "Windows"} instructions</h3><p>{instructions.note}</p>{instructions.command && <div className="guide-command"><div><span>{platform === "mac" ? "Terminal" : "PowerShell"}</span><Button size="icon" variant="ghost" title={copied ? "Copied" : "Copy command"} aria-label={copied ? "Copied command" : "Copy command"} onClick={async () => { try { await navigator.clipboard.writeText(instructions.command ?? ""); setCopied(true); setCopyError(""); } catch { setCopyError("Copy is unavailable. Select the command text and copy it manually."); } }}>{copied ? <Check /> : <Copy />}</Button></div><pre><code>{instructions.command}</code></pre></div>}{copyError && <p role="alert">{copyError}</p>}<p className="guide-disclosure">A check from your computer reflects your own connection. It may differ from a remote test or the mockup shown here.</p></section>
      <section className="guide-section"><h2>Keep this in mind</h2><p>{guide.limit}</p></section>
      <footer className="guide-footer"><Button variant="outline" asChild><Link to="/blog"><ArrowLeft />All guides</Link></Button>{toolExists ? <Button variant="glossy" asChild><Link to="/tools/$slug" params={{ slug }}>Try {toolName}<ArrowUpRight /></Link></Button> : null}</footer>
    </article>
    {related.length > 0 && <section className="guide-related"><h2>Keep exploring</h2><div className="blog-grid">{related.map(item => <Button variant="ghost" className="blog-card" asChild key={item.name}><Link to="/blog/$slug" params={{ slug: getToolSlug(item) }}><span className="eyebrow">{item.category}</span><h3>A simple guide to {item.name.toLowerCase()}</h3><p>{guides[getToolSlug(item)]?.summary}</p><span className="blog-card-bottom">Read the guide<ArrowUpRight size={18} /></span></Link></Button>)}</div></section>}
  </main></div>;
}
