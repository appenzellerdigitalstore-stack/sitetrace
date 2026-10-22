import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - SiteTrace" },
      { name: "description", content: "How SiteTrace handles visitor data, cookies, analytics, and outbound links. Plain-English coverage of what we collect and what we do not." },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <div className="site-page"><main className="shell prose-page">
    <div className="eyebrow"><span className="status-dot" />Legal</div>
    <h1>Privacy Policy</h1>
    <p className="hero-copy" style={{ marginBottom: 32 }}>What we collect, what we do not, and how third-party services used on this site handle your data.</p>
    <p style={{ color: "var(--muted-foreground)", fontSize: 13, marginBottom: 28 }}>Last updated: October 22, 2026</p>

    <h2>1. Information we collect</h2>
    <p>We collect very little. SiteTrace is a set of free network and diagnostic tools, and most of them run entirely in your browser. Our hosting provider (Cloudflare) and analytics layer (Cloudflare Web Analytics) automatically log basic request data when you load a page: your IP address (truncated), user agent, referrer, and the URL requested. We use that only to monitor traffic, detect abuse, and improve the tools.</p>
    <p>You do not need an account. We do not collect your name or email unless you choose to email us.</p>

    <h2>2. Where your data is processed</h2>
    <p>Most SiteTrace tools run client-side. When you paste a hostname into the DNS Lookup tool, for example, that query is made from your browser and is not stored on our servers as a permanent record of who asked. Tools that need a server-side helper (for example, looking up a WHOIS record) send only the value you typed - never your name, email, or account details.</p>

    <h2>3. Cookies and local storage</h2>
    <p>We do not set advertising cookies of our own. We do not use third-party tracking cookies. Cloudflare Web Analytics is privacy-first and does not rely on cookies for cross-site tracking. Some tools store your preferences (such as a preferred language) in your browser's local storage so they persist between visits; that data stays on your device.</p>

    <h2>4. Advertising</h2>
    <p>Once this site is approved for ads, it displays ads served by Google AdSense. AdSense uses cookies to serve ads based on a user's prior visits to this or other sites. Google's use of advertising cookies enables it and its partners to serve ads based on visits to this and other websites. You can opt out of personalised advertising at <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">Google Ads Settings</a>, and read more about <a href="https://support.google.com/adsense/answer/95421" target="_blank" rel="noreferrer">how Google uses data from partner sites</a>.</p>

    <h2>5. Third-party services and outbound links</h2>
    <p>SiteTrace links out to external resources: documentation, WHOIS registries, IP databases, and project pages. Once you follow one of those links, their privacy policy applies, not this one. We are not responsible for how third-party sites handle your data.</p>

    <h2>6. Children's privacy</h2>
    <p>SiteTrace is a technical utility and is not directed at children under 13. We do not knowingly collect data from anyone under that age.</p>

    <h2>7. Your rights</h2>
    <p>You may request access to, correction of, or deletion of any personal data we hold about you. Contact us and we will respond within 30 days.</p>

    <h2>8. Data retention</h2>
    <p>Analytics data is retained on Cloudflare's standard schedule. We do not maintain a persistent database of visitor identities.</p>

    <h2>9. Changes to this policy</h2>
    <p>We may update this policy from time to time. The "last updated" date at the top reflects the most recent change.</p>

    <h2>10. Contact</h2>
    <p>For privacy questions or data requests, email <strong>privacy [at] sitetrace.it.com</strong>.</p>

    <p style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
      <ShieldCheck size={15} style={{ color: "var(--primary)" }} />
      SiteTrace is an independent project. See also our <Link to="/terms" style={{ textDecoration: "underline" }}>Terms of Service</Link> and <Link to="/about" style={{ textDecoration: "underline" }}>About page</Link>.
    </p>
  </main></div>;
}