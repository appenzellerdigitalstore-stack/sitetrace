import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service - SiteTrace" },
      { name: "description", content: "Terms governing use of the SiteTrace network and diagnostic tools: acceptable use, third-party data, limitation of liability, and your responsibilities." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return <div className="site-page"><main className="shell prose-page">
    <div className="eyebrow"><span className="status-dot" />Legal</div>
    <h1>Terms of Service</h1>
    <p className="hero-copy" style={{ marginBottom: 32 }}>The rules of the road for using SiteTrace. Short, plain-English, and as honest as we can make it.</p>
    <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginBottom: 28 }}>Last updated: October 22, 2026</p>

    <h2>1. What this site is</h2>
    <p>SiteTrace is a free collection of network and web diagnostic tools: DNS lookup, WHOIS, IP lookup, traceroute, ping, HTTP header inspection, and similar utilities. The tools query public infrastructure - DNS resolvers, WHOIS registries, IP geolocation databases - and present the result. We do not own that infrastructure and cannot guarantee its accuracy or availability.</p>

    <h2>2. Accuracy and availability</h2>
    <p>Diagnostic output reflects what the queried system returned at the moment of the query. Public DNS, WHOIS registries, and routing tables are sometimes slow, stale, rate-limited, or wrong. Treat SiteTrace output as a signal, not as ground truth. Do not make safety-critical, financial, or legal decisions based solely on a single SiteTrace result.</p>

    <h2>3. Rate limits and fair use</h2>
    <p>The tools are free and run through public infrastructure and our own edge network. Automated or high-volume use that degrades service for other visitors is not permitted. If we rate-limit or block an address, we will not warn in advance.</p>

    <h2>4. Probing other systems</h2>
    <p>Tools such as traceroute, ping, and port-related lookups send traffic to hosts you specify. Only use them against systems you own or have permission to test. Using SiteTrace to attack, scan, or harass third-party infrastructure is a violation of these terms and may be unlawful in your jurisdiction.</p>

    <h2>5. Acceptable use</h2>
    <p>Do not use SiteTrace to attempt unauthorised access to any system, to distribute malware, to scrape the site at a rate that degrades service for others, or to impersonate SiteTrace in correspondence with third-party operators.</p>

    <h2>6. Intellectual property</h2>
    <p>SiteTrace's layout, copy, and tool implementations are by Edy Appenzeller, 2026. Underlying data belongs to its respective providers - DNS is operated by registries and resolvers, WHOIS records by their registrars, geolocation by its database vendors. Trademarks belong to their owners. SiteTrace is an independent project and is not affiliated with any tool or data provider it queries.</p>

    <h2>7. No warranty</h2>
    <p>SiteTrace is provided "as is" and "as available", without warranty of any kind, express or implied. We do not guarantee that the site will be available, that any tool will function, or that any result will be correct.</p>

    <h2>8. Limitation of liability</h2>
    <p>To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of SiteTrace, or from your use of, or reliance on, any result it produces.</p>

    <h2>9. Changes to these terms</h2>
    <p>We may update these terms. The "last updated" date at the top reflects the most recent change.</p>

    <h2>10. Contact</h2>
    <p>Questions about these terms can go to <strong>legal [at] sitetrace.it.com</strong>.</p>

    <p style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
      <FileText size={15} style={{ color: "var(--primary)" }} />
      See also our <Link to="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</Link> and <Link to="/about" style={{ textDecoration: "underline" }}>About page</Link>.
    </p>
  </main></div>;
}