import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, MessageSquare, Bug, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact SiteTrace" },
      { name: "description", content: "Report a broken SiteTrace tool, request a new one, or correct a result. SiteTrace is run by one person and every message is read." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return <div className="site-page"><main className="shell prose-page contact-page">
    <div className="eyebrow"><span className="status-dot" />Contact</div>
    <h1>Get in touch<span className="brand-dot">.</span></h1>
    <p className="hero-copy" style={{ marginBottom: 32 }}>SiteTrace is run by one person. Tool requests, bug reports and corrections all go to the same inbox, and all of them get read.</p>

    <h2>Email</h2>
    <p>The fastest way to reach the maintainer is <strong>hello [at] sitetrace.it.com</strong>. There is no contact form, no ticket queue and no chatbot &mdash; just email, answered by the person who wrote the code.</p>

    <h2>What to include</h2>
    <p>Most messages can be answered with four things. Including them turns a back-and-forth into a single reply.</p>
    <ul>
      <li><strong>The tool.</strong> The exact URL, for example <code>/tools/dns-lookup</code>, plus the record type or options you had selected.</li>
      <li><strong>What you expected.</strong> The answer you were looking for, if you already know it.</li>
      <li><strong>What you got.</strong> The result the tool actually returned, copied rather than described from memory.</li>
      <li><strong>When it happened.</strong> The date and time, and the country you were connecting from. A timestamp is often the difference between a reproducible bug and a mystery.</li>
    </ul>
    <p>If a tool returned a result you believe is wrong, the result itself is the most useful evidence. Copy it before reloading the page, because some panels reset when you run a new check.</p>

    <h2>Requesting a tool</h2>
    <p>Tool requests are welcome, and the most useful ones describe the problem rather than the solution. &ldquo;A domain I own resolves differently from my mail provider than it does from my laptop&rdquo; is a request that can be acted on. &ldquo;Add a BGP tool&rdquo; is not, on its own.</p>
    <p>Requests are prioritised by how many people hit the same wall. A single person hitting a wall still counts, but the order in which things get built follows the queue rather than the loudest request.</p>

    <h2>What is out of scope</h2>
    <p>SiteTrace is a diagnostic toolkit, not a security or operations service. It cannot scan a network for you, audit a host you do not own, run a penetration test, or take over a support case for a third-party provider. Requests that need one of those will be declined, usually with a pointer to the tool that does the job properly.</p>
    <p>It also cannot tell you why <em>your</em> website is down. The tools show you what the public internet sees at that moment &mdash; a status code, a set of headers, a resolver answer. Reading that output and working out what it means is where the site stops and your own investigation begins.</p>

    <h2>Response time</h2>
    <p>Bug reports are usually answered within a few days. Tool requests are not a queue with deadlines; they are worked through as time allows, and a request that is answered by a similar tool already on the site usually gets a reply faster than a request that needs something built.</p>
    <p>If a message turns out to need a paid service or a third-party account, you will be told that plainly rather than given a vague answer.</p>

    <h2>Before you write</h2>
    <p>Two pages answer a surprising share of questions. <Link to="/about" style={{ textDecoration: "underline" }}>About SiteTrace</Link> explains what the project is and who runs it, and the <Link to="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</Link> and <Link to="/terms" style={{ textDecoration: "underline" }}>Terms</Link> cover what happens to the data a tool handles.</p>

    <p style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: 13, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <Mail size={15} style={{ color: "var(--primary)" }} />
      <MessageSquare size={15} style={{ color: "var(--primary)" }} />
      <Bug size={15} style={{ color: "var(--primary)" }} />
      <Clock size={15} style={{ color: "var(--primary)" }} />
      hello [at] sitetrace.it.com · answered by the maintainer · also builds{" "}
      <a href="https://agentstack.ink" target="_blank" rel="noreferrer">AgentStack<ArrowUpRight size={11} style={{ display: "inline", verticalAlign: -1 }} /></a>{" "}
      and{" "}
      <a href="https://opensourcestack.ink" target="_blank" rel="noreferrer">OpenSourceStack<ArrowUpRight size={11} style={{ display: "inline", verticalAlign: -1 }} /></a>
    </p>
  </main></div>;
}
