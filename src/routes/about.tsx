import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, User, Zap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SiteTrace" },
      { name: "description", content: "SiteTrace is a free set of network and web diagnostic tools built and run by Edy Appenzeller. Why it exists, what it does, and how it stays free." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return <div className="site-page"><main className="shell prose-page">
    <div className="eyebrow"><span className="status-dot" />About</div>
    <h1>Clarity in every connection.</h1>
    <p className="hero-copy" style={{ marginBottom: 32 }}>SiteTrace is a free set of network and web diagnostic tools. Built, run, and maintained by one person.</p>

    <h2>Who runs this</h2>
    <p><strong>Edy Appenzeller</strong> is the founder, developer, and maintainer of SiteTrace. He builds the tools, runs the infrastructure, and answers the email. There is no team, no paid placement, and no data brokerage.</p>
    <p>Edy also runs <a href="https://agentstack.ink" target="_blank" rel="noreferrer">AgentStack<ArrowUpRight size={11} style={{ display: "inline", verticalAlign: -1 }} /></a>, a curated directory of MCP servers for AI agents, and <a href="https://opensourcestack.ink" target="_blank" rel="noreferrer">OpenSourceStack<ArrowUpRight size={11} style={{ display: "inline", verticalAlign: -1 }} /></a>, a directory of open-source alternatives to paid software.</p>

    <h2>Why this exists</h2>
    <p>Most network tools online are ad-stuffed, slow, or gated behind a signup. When something breaks - a DNS record that will not resolve, an IP that needs explaining, a header that looks wrong - you should be able to get a straight answer in three seconds without giving up your email address.</p>
    <p>SiteTrace is that: fast, free, and private by default. No account, no tracking cookies, no interstitial ads in the tool output itself.</p>

    <h2>How it stays free</h2>
    <p>SiteTrace runs on Cloudflare's free tier. Most tools execute entirely in your browser. The few that need a server-side helper use serverless functions at the edge. There is no server to rent, so there is no paywall.</p>
    <p>If advertising is ever enabled to cover domain and tooling costs, it will be confined to the site chrome and will not obstruct a tool's result.</p>

    <h2>What SiteTrace is not</h2>
    <p>It is not a monitoring service, a security scanner, or a penetration-testing tool. It is not affiliated with any DNS provider, registry, ISP, or geolocation vendor it queries. Diagnostic output reflects what public infrastructure returned at query time and can be stale, rate-limited, or wrong.</p>

    <h2>Principles</h2>
    <ul>
      <li><strong>No account required.</strong> Every tool is usable immediately.</li>
      <li><strong>Privacy first.</strong> See the <Link to="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</Link>.</li>
      <li><strong>Honest output.</strong> When a tool cannot get an answer, it says so rather than guessing.</li>
      <li><strong>No dark patterns.</strong> No fake progress bars, no interstitials between you and a result.</li>
    </ul>

    <h2>Get in touch</h2>
    <p>Corrections, bug reports, and tool requests are all welcome. Email <strong>hello [at] sitetrace.it.com</strong>.</p>

    <p style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <User size={15} style={{ color: "var(--primary)" }} />
      <Zap size={15} style={{ color: "var(--primary)" }} />
      <ShieldCheck size={15} style={{ color: "var(--primary)" }} />
      Independent, free, and ad-light. See our <Link to="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</Link> and <Link to="/terms" style={{ textDecoration: "underline" }}>Terms</Link>.
    </p>
  </main></div>;
}