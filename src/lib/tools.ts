import { Globe, ShieldCheck, Shield, Network, Activity, Radio, Orbit, Server, ListChecks, Braces, LockKeyhole, Mail, Search, PanelsTopLeft, KeyRound, Palette, AlignLeft, Zap, Terminal, Fingerprint, Waypoints, type LucideIcon } from "lucide-react";

export type Tool = { name: string; description: string; category: string; command: string; icon: LucideIcon; label: string };
export const getToolSlug = (tool: Tool) => tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
export const categories = ["All tools", "Network & IP", "DNS & connectivity", "Web & security", "Email & certificates", "SEO & preview", "Utilities"] as const;
export const tools: Tool[] = [
  { name: "IP lookup", description: "Every IP has a story. Find its location, ISP, and network.", category: categories[1], command: "curl https://ipinfo.io/8.8.8.8", icon: Globe, label: "ip lookup" },
  { name: "IP reputation", description: "Check an IP against blocklists. Know who you're connecting to.", category: categories[1], command: "nslookup 8.8.8.8.zen.spamhaus.org", icon: ShieldCheck, label: "ip reputation" },
  { name: "VPN check", description: "Uncover VPN, proxy, and hosting signals behind an IP.", category: categories[1], command: "curl https://ipinfo.io/8.8.8.8", icon: Fingerprint, label: "vpn check" },
  { name: "Subnet calculator", description: "From CIDR to address ranges. Make your network make sense.", category: categories[1], command: "python3 -c \"import ipaddress; print(ipaddress.ip_network('192.168.1.0/24'))\"", icon: Network, label: "subnet" },
  { name: "Ping test", description: "Measure response times and find the distance in milliseconds.", category: categories[2], command: "ping -c 4 example.com", icon: Activity, label: "ping" },
  { name: "DNS lookup", description: "Resolve the details. A, AAAA, MX, TXT, and everything between.", category: categories[2], command: "dig example.com ANY", icon: Radio, label: "dig +short" },
  { name: "DNS propagation", description: "See your DNS changes travel across global resolvers.", category: categories[2], command: "dig @8.8.8.8 example.com; dig @1.1.1.1 example.com", icon: Orbit, label: "propagate" },
  { name: "Is it down?", description: "Just you or everyone? Check whether a website is reachable.", category: categories[3], command: "curl -I https://example.com", icon: Activity, label: "status" },
  { name: "Bulk URL status", description: "Multiple URLs. One clear picture of what's up and what's not.", category: categories[3], command: "for url in https://example.com https://example.org; do curl -I \"$url\"; done", icon: ListChecks, label: "bulk status" },
  { name: "HTTP headers", description: "Go beneath the page. Inspect responses, caching, and servers.", category: categories[3], command: "curl -I https://example.com", icon: Braces, label: "curl -I" },
  { name: "Security headers", description: "Spot missing protection in your website's response headers.", category: categories[3], command: "curl -sI https://example.com", icon: Shield, label: "sec headers" },
  { name: "Email deliverability", description: "Inspect SPF, DKIM, and DMARC. Give your email a clear path.", category: categories[4], command: "dig example.com TXT; dig _dmarc.example.com TXT", icon: Mail, label: "spf / dmarc" },
  { name: "SSL certificate", description: "Check your certificate's issuer, validity, and expiration.", category: categories[4], command: "openssl s_client -connect example.com:443 -servername example.com </dev/null", icon: LockKeyhole, label: "ssl cert" },
  { name: "SEO checker", description: "Look closer at titles, metadata, canonical tags, and indexing.", category: categories[5], command: "curl -sL https://example.com", icon: Search, label: "seo audit" },
  { name: "Open Graph preview", description: "Inspect the metadata that shapes your social first impression.", category: categories[5], command: "curl -sL https://example.com | grep 'og:'", icon: PanelsTopLeft, label: "og preview" },
  { name: "Password generator", description: "Strong, random, and yours alone. Security starts here.", category: categories[6], command: "openssl rand -base64 24", icon: KeyRound, label: "passwd" },
  { name: "Random color", description: "Find your next color. Generate a random hexadecimal value.", category: categories[6], command: "openssl rand -hex 3", icon: Palette, label: "color" },
  { name: "Word counter", description: "Words, characters, and lines. Every little detail accounted for.", category: categories[6], command: "wc -w your-file.txt", icon: AlignLeft, label: "wc" },
  { name: "Smart dispatcher", description: "Identify a URL, domain, or IP and choose the right diagnostic.", category: categories[6], command: "nslookup example.com", icon: Zap, label: "dispatch" },
  { name: "Traceroute", description: "Follow every hop between you and your destination.", category: categories[2], command: "traceroute example.com", icon: Waypoints, label: "trace" },
  { name: "Port check", description: "Check whether a service is listening on the port you expect.", category: categories[3], command: "nc -zv example.com 443", icon: Server, label: "port check" },
];