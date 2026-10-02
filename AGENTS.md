# SiteTrace — Agent Notes

Static-site front door to api.sitetrace.it.com (paid API). Lives on Cloudflare Pages,
auto-deploys from `main`. Brand-free ad-funded site + Paddle-paid API.

Ed owns Cloudflare dashboard / Namecheap / AdSense / GSC / Paddle / Discord.
Agent owns: pushing to GitHub, writing HTML/CSS/JS, building Cloudflare Workers.

---

## Critical rules — read first

### 1. Tailwind CDN is mandatory on every page that uses utility classes

Every HTML page that uses Tailwind utility classes (`bg-`, `flex`, `h-`, `max-w-`,
`text-`, `grid`, etc.) MUST include:

```html
<script src="https://cdn.tailwindcss.com?plugins=forms"></script>
```

Without it, the Tailwind utilities silently fail: body text renders black on the
dark bg, nav items stack vertically without flex, and the page looks like an
un-styled 1995 document. The inline `tailwind.config = { ... }` block must follow
the CDN script. Failure is silent — no console error, no obvious log.

Symptom: "page looks broken but no errors" → missing Tailwind CDN.

### 2. Cache-buster query string on every JS reference

Every HTML page that references `/js/i18n.js` or `/js/layout.js` MUST use a
versioned query string:

```html
<script src="/js/i18n.js?v=29"></script>
<script src="/js/layout.js?v=30"></script>
```

Bump `v=N` on every HTML page whenever the JS content changes, or browsers will
hold stale cached versions for `max-age=31536000, immutable` — the fix never
reaches the user. Use `scripts/bump-i18n-cache-buster.mjs` (one-shot, idempotent,
auto-bumps every HTML file in the repo).

### 3. Brand rules — cyan + JetBrains Mono + IBM Plex Sans. Never Inter, never AI purple.

| Element      | Rule                                                       |
| ------------ | ---------------------------------------------------------- |
| Accent       | `#22d3ee` (cyan-400). Sub-tones: `#67e8f9`, `#06b6d4`, `#0891b2` |
| Body font    | IBM Plex Sans (humanist, distinctly NOT Inter)             |
| Mono font    | JetBrains Mono (technical accents, code blocks, bylines)   |
| Background   | `#070a12` (ink-900)                                        |
| Card border  | `rgba(34, 211, 238, 0.08)` cyan hairline                  |
| Forbidden    | Inter (rendering font), brand-blue gradients (`#3b62f4`, `#5e83ff`) on the **brand** layer (logo, hero, banner) |
| Allowed (small accents) | Tailwind built-in `from-purple-500 to-pink-500` and similar multi-color gradients on per-button CTAs on individual tool pages — Ed has confirmed these read as tasteful accents, not as "AI brand" identity. Keep the brand layer strictly cyan. |
| Allowed category palette | cyan (Network+SEO), amber (#fbbf24, DNS), green (#34d399, Web status), slate (#94a3b8, Email) |

Engineers recognize it from the JetBrains Mono byline `// last updated YYYY-MM-DD · built by edy appenzeller · open source` and the cyan grid background. Both are non-negotiable.

### 4. AI-content gate

Every published page must score **under 30% AI probability** on sitetrace-api's
own `/api/ai-content-detector`. Use `scripts/audit-ai.mjs <file.html>` — reads
the file, strips tags, sends 3500 chars to the API, prints the result. Ed's
target: 0 phrases detected, "likely_human", burstiness > 5.

### 5. Never `git add .`

Always `git status --short` first. Stage only files you touched in this session.
The repo has ~40 pre-existing scripts (`scripts/*.cjs`, `*.ps1`, `*.py`) that are
NOT mine — never stage them accidentally. Untracked `.tmp/` is for screenshots,
never staged.

---

## Project layout

```
F:\.Projects\sitetrace\
  index.html                    — landing page (front door)
  network-tools/index.html      — 5-category hub (NEW, Sep 2026)
  what-is-my-ip/index.html      — redesigned Sep 2026
  is-it-down/index.html         — redesigned Sep 2026
  ping/, dns-tools/, ..., vpn-checker/, etc.   — 11 tool pages
  about/, blog/, privacy/       — content
  api/                          — api.sitetrace.it.com landing (separate brand)
  js/                           — i18n.js, layout.js, per-tool JS modules
  styles.css                    — shared styles (.nav-link, .card, .support-fab)
  functions/api/                — sitetrace-api Cloudflare Worker endpoints (paid)
  scripts/                      — agent scripts (mine + pre-existing; never stage the pre-existing ones)
```

## i18n module (`js/i18n.js`)

6 dictionaries: `en`, `es`, `pt`, `fr`, `de`, `it`. All keys must exist in all
6 before any HTML references them via `data-i18n="key"`. Missing keys silently
render the raw key as text.

Adding new keys: locate each language block by its existing anchor (e.g.
`front_hero_title: '...'`) and add the new key right after. Use UTF-8 straight
quotes, no smart quotes (PowerShell heredoc and some editors will turn `'` into
`'` and break the JSON parse).

## Lang indicator defensive fix (commit `d74ee2b`)

`js/i18n.js init()` updates `#lang-current` textContent + `.lang-option` active
class directly after `setLanguage()`. This is a defensive inline update — the
existing `layout.js wireLanguage()` was racing with i18n init and the language
display sometimes didn't update. Don't remove the inline block in i18n.js — it's
the safety net.

## Cloudflare Pages workflow

1. `git push origin main` from `F:\.Projects\sitetrace`
2. Cloudflare Pages auto-deploys from the GitHub integration
3. Custom domain `sitetrace.it.com` (apex) is canonical; `www.` 301s to apex
   via Page Rule id `2ec2f781693f5a0aa43a53da5ff9ebd3`. Don't use
   `_redirects` for host redirects — Pages parser is path-only.
4. To verify: `Invoke-WebRequest -MaximumRedirection 0 https://www.sitetrace.it.com/` → expect 301 with apex Location.

## Browser automation

Edge only on port 9223 with isolated profile at
`C:\Users\edy_a\.minimax\edge-automation-profile`. Chrome is permanently off
the table (Ed lost access to an email via a Chrome profile mishap).

Use `scripts/start-edge-debug.ps1` to launch Edge. Use `scripts/shot.mjs <url> <out> [tab] [h]`
for headless screenshots — `defaultViewport: { width: 1280, height: 1600 }` to
avoid Edge's actual window size cropping views.

Headless mode by default. Never log in. Never visit URLs Ed hasn't approved.
Screenshots of my own drafts on preview URLs only.

## Ed's operating preferences (cross-project)

- $0 monthly budget. Cloudflare free tier, free public APIs, Paddle over Stripe. No paid tools.
- Organic-only growth (no cold DMs/email). 9-15 month timeline for $3k/mo.
- Free tier no-signup + IP-rate-limited.
- Ed pushes code via GitHub; agent pushes code, owns nothing else.
- Ed hates: freelance/consulting/Upwork, AI-purple/blue gradients, Inter font.

## AdSense

`<script src="...?client=ca-pub-8749554989768993">` in `<head>` of every page
(auto-ads); `/ads.txt` with `google.com, pub-8749554989768993, DIRECT, f08c47fec0942fa0`
(use `pub-`, not `ca-pub-`).

## Paddle sandbox state

- Hobby: `pro_01m3tc3y6p4sf9xn01zknr03jp` / `pri_01m3tceygyeetg9smeapr06ae1` ($9.99)
- Pro: `pro_01m3tchdmcwqdpkh6tkarwacar` / `pri_01m3tcq9wmrbpn6ps3wdvkd5rc` ($30)
- Sandbox API key: `paddle_sdbx_apikey_01m3te34gd864w7gw94jr2abfp_Z6QdbDdF9JYK1ea8yrjWrE_Axo`
- Webhook secret: `ntfset_01m3terg5n1zzjgsk01q23xe83`

Still sandbox — do NOT flip to live without Ed's explicit go-ahead.

## Affiliate rule

sitetrace's `/about/` page criticises affiliate-spam sites. DO NOT add an
affiliate section to sitetrace without real affiliate tracking IDs. Homepage
links with `rel="sponsored"` but no tracking look exactly like the spammy
pattern the site calls out.

## Useful scripts

| Script | Purpose |
| ------ | ------- |
| `scripts/audit-ai.mjs <file>` | Run file through `/api/ai-content-detector` (need `SITETRACE_KEY` env var) |
| `scripts/apply-cyan-pass.mjs` | Idempotent — swap brand-blue Tailwind config to cyan + insert trace-token CSS + byline |
| `scripts/bump-i18n-cache-buster.mjs` | Bump `?v=N` on i18n.js + layout.js references across all HTML files |
| `scripts/start-edge-debug.ps1` | Launch Edge on port 9223 with isolated profile |
| `scripts/shot.mjs <url> <out> [tab] [h]` | Headless screenshot via Edge CDP |