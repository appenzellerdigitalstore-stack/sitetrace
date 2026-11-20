import { Link } from "@tanstack/react-router";
import { BrandMark } from "./site-header";

// Site-wide footer. Rendered from the root shell so every page - including
// tool pages, guides and the 404 - carries the policy and contact links.
// Without these, a reviewer landing on a tool page had no way to reach the
// privacy policy, the terms or a contact address.
export function SiteFooter() {
  return <footer className="shell footer">
    <a href="/" className="brand" aria-label="SiteTrace home"><span className="brand-mark"><BrandMark /></span><span>SiteTrace<span className="brand-dot">.</span></span></a>
    <nav className="footer-links" aria-label="Site information">
      <Link to="/about">About</Link>
      <Link to="/contact">Contact</Link>
      <Link to="/privacy">Privacy</Link>
      <Link to="/terms">Terms</Link>
      <Link to="/tools">Tools</Link>
      <Link to="/blog">Blog</Link>
    </nav>
    <span className="footer-meta">© {new Date().getFullYear()} SiteTrace · Stay curious</span>
  </footer>;
}
