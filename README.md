# SiteTrace

> Instant IP, geolocation, and network exposure lookup.
> Lightning-fast, privacy-aware, multi-language. No tracking, no server.

**[sitetrace.it.com](https://sitetrace.it.com)** — live site

---

## What it does

| View | What you get |
|---|---|
| **Home** | Your public IP, country/region/city, ISP, ASN, timezone, and whether your connection is **Protected** / **Exposed** / behind a **VPN** / **Proxy** / **Tor** |
| **Ping** | Real-time latency to 9 global servers with rolling min/avg/max/jitter |
| **DNS & Tools** | DNS-over-HTTPS lookup (A/AAAA/MX/TXT/NS/CNAME/SOA) via Google + Cloudflare |

Languages: **English, Español, Português, Français** — auto-detected, with a manual switcher.

---

## Tech

- Plain HTML + vanilla JS, no build step
- Tailwind CSS via CDN (Play CDN, JIT)
- Inter + JetBrains Mono (Google Fonts)
- IP data: [ipwho.is](https://ipwho.is) (primary) with [ip-api.com](https://ip-api.com) fallback
- DNS data: [Google DNS-over-HTTPS](https://developers.google.com/speed/public-dns/docs/doh/json) with Cloudflare fallback
- Hosting: [Cloudflare Pages](https://pages.cloudflare.com) (free, free SSL, global CDN)

---

## Local dev

```bash
npm run dev    # python -m http.server 8000
```
Open <http://localhost:8000>.

---

## Deploy

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step.

Quick path:
```bash
export CLOUDFLARE_API_TOKEN="your-token"
npm install
npm run deploy
```

Then add the custom domain in the Cloudflare dashboard and a CNAME at your DNS provider.

---

## Project layout

```
sitetrace/
├── index.html              ← entry, all 3 views, Tailwind config
├── styles.css              ← custom styles (cards, badges, ping rows, ad slots)
├── wrangler.toml           ← Cloudflare Pages config
├── _headers                ← security & cache headers
├── _redirects              ← future redirects
├── package.json            ← scripts (dev, deploy)
├── deploy.ps1              ← one-shot Windows deploy
├── deploy.sh               ← one-shot *nix deploy
├── DEPLOY.md               ← full deployment guide
├── js/
│   ├── i18n.js             ← translations (EN/ES/PT/FR) + auto-detect
│   ├── app.js              ← IP lookup, geolocation, security status
│   ├── ping.js             ← real-time latency test
│   └── dns.js              ← DNS-over-HTTPS lookup
└── .github/
    └── workflows/
        └── deploy.yml      ← auto-deploy on push to main
```

---

## License

All rights reserved. © 2026 SiteTrace.
