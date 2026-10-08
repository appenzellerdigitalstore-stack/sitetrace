import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock3, Search, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="header-clock" aria-label="Current local time"><Clock3 size={13} /><time dateTime={now?.toISOString()}>{now ? now.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}</time><span>LOCAL</span></div>;
}

export function SiteHeader({ onQuickOpen }: { onQuickOpen?: () => void }) {
  return <header className="site-header"><div className="shell header-inner">
    <Link to="/" className="brand" aria-label="SiteTrace home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span className="brand-mark"><Terminal /></span><span>SiteTrace<span className="brand-dot">.</span></span></Link>
    <nav className="nav-links" aria-label="Main navigation">
      <Button variant="ghost" size="sm" asChild><Link to="/" hash="tools">Diagnostic tools</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/" hash="about">About</Link></Button>
      <Button variant="ghost" size="sm" asChild><Link to="/blog" activeProps={{ className: "nav-active" }}>Blog</Link></Button>
    </nav>
    <LiveClock />
    {onQuickOpen ? <Button variant="ghost" size="icon" className="header-search" onClick={onQuickOpen} aria-label="Open quick search"><Search /></Button> : <Button variant="ghost" size="icon" className="header-search" asChild><Link to="/" hash="tools" aria-label="Find a diagnostic tool"><Search /></Link></Button>}
  </div></header>;
}