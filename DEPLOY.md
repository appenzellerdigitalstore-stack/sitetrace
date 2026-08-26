# Deploying SiteTrace to sitetrace.it.com

This guide walks you through going from **local code** to a **live site at `https://sitetrace.it.com`** with one-time setup, then one-command deploys forever after.

---

## Architecture

```
                ┌────────────────────────────┐
   User ──────► │ Cloudflare Pages (CDN/SSL) │ ◄──── git push / wrangler
                └────────────┬───────────────┘
                             │ CNAME
                             ▼
                  Namecheap DNS (it.com zone)
                  sitetrace.it.com ──► sitetrace.pages.dev
```

- **Source of truth**: this folder (`index.html`, `styles.css`, `js/`, `wrangler.toml`, `_headers`, `_redirects`)
- **Hosting**: Cloudflare Pages (free tier — unlimited bandwidth, free SSL, global edge cache)
- **DNS**: stays at Namecheap — we just add a single CNAME
- **Deploys**: `wrangler pages deploy` from local *or* auto-deploy on every `git push` to `main` via GitHub Actions

---

## Step 1 — Create a Cloudflare account (free)

1. Go to <https://dash.cloudflare.com/sign-up>
2. Verify your email
3. You do **not** need to add `it.com` as a Cloudflare zone — we only use Cloudflare Pages

---

## Step 2 — Create an API token

1. Go to <https://dash.cloudflare.com/profile/api-tokens>
2. Click **Create Token**
3. Use the **"Edit Cloudflare Pages"** template, or create a custom token with these permissions:
   - **Account → Cloudflare Pages → Edit**
   - Account Resources: `Include → <your account>`
   - Zone Resources: *(none — we don't need to edit DNS via API)*
4. Click **Continue to summary** → **Create Token**
5. **Copy the token** (you only see it once — store it somewhere safe)

> 🔒 Treat this token like a password. Anyone with it can deploy to your Cloudflare Pages.

---

## Step 3 — First deploy (one command)

From the project folder:

### Windows (PowerShell)
```powershell
$env:CLOUDFLARE_API_TOKEN = "paste-your-token-here"
npm install
npm run deploy
```

### macOS / Linux / Git Bash
```bash
export CLOUDFLARE_API_TOKEN="paste-your-token-here"
npm install
npm run deploy
```

This will:
- Create the `sitetrace` project on Cloudflare Pages (if it doesn't exist yet)
- Upload all the static files
- Print the live URL: **https://sitetrace.pages.dev**

Open that URL — your site is live.

---

## Step 4 — Wire the custom domain `sitetrace.it.com`

### 4a. Add the domain to Cloudflare Pages

Open the Cloudflare dashboard:

1. <https://dash.cloudflare.com/> → **Workers & Pages** → click `sitetrace` → **Custom domains** tab → **Set up a custom domain**
2. Enter `sitetrace.it.com` and click **Continue**
3. Cloudflare will tell you the CNAME target. Since DNS is on Namecheap (not Cloudflare), we'll set it there in the next step.

### 4b. Add the CNAME record at Namecheap

1. Log in to <https://www.namecheap.com>
2. **Domain List** → `it.com` (or `sitetrace.it.com` if it has its own row) → **Manage**
3. Go to the **Advanced DNS** tab
4. Remove the default parking A record for `sitetrace` if present
5. Add a new record:

| Type  | Host        | Target                | TTL       |
|-------|-------------|-----------------------|-----------|
| CNAME | `sitetrace` | `sitetrace.pages.dev` | Automatic |

6. **Save all changes**

### 4c. Wait for SSL

Cloudflare auto-provisions a free SSL certificate once DNS resolves correctly. This usually takes **1–5 minutes**, sometimes up to 15. You can track the status in the Cloudflare dashboard under **Custom domains**.

When it says **Active**, open <https://sitetrace.it.com> — you're live. 🎉

---

## Step 5 — Future deploys

You have three options, pick whichever fits your workflow:

### Option A: Local one-liner
```bash
npm run deploy
```
Best when iterating locally and you don't want a GitHub repo.

### Option B: GitHub auto-deploy (recommended for a real product)
1. Create a new GitHub repo: <https://github.com/new> (private or public, your call)
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial SiteTrace release"
   git branch -M main
   git remote add origin https://github.com/<you>/sitetrace.git
   git push -u origin main
   ```
3. In Cloudflare dashboard: **Workers & Pages** → `sitetrace` → **Settings** → **Builds** → **Connect to Git**
4. Select the GitHub repo, branch `main`, build command = *(empty)*, build output = `/`
5. Add two GitHub repository secrets: **Settings → Secrets and variables → Actions**:
   - `CLOUDFLARE_API_TOKEN` — the same token from Step 2
   - `CLOUDFLARE_ACCOUNT_ID` — find it at the bottom-right of any Cloudflare dashboard page

After this, **every push to `main` auto-deploys** and a PR gets a preview URL automatically.

### Option C: Both
Use GitHub for production, `npm run deploy` for hotfixes.

---

## Adding more languages

Edit `js/i18n.js`:
1. Add a new entry to the `dictionaries` object (e.g. `de:` for German)
2. Add a button to the language menu in `index.html`:
   ```html
   <li><button class="lang-option" data-lang="de" role="option">Deutsch</button></li>
   ```
3. Add a link in the footer language list too.

That's it — the i18n module auto-detects the new language and the switcher works.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `wrangler: command not found` | No local install | `npm install` |
| `Authentication error [code: 10000]` | Bad/expired token | Re-create the API token |
| `sitetrace.it.com` shows Namecheap parking | CNAME not added or stale | Verify the CNAME record at Namecheap, wait 5 min |
| `sitetrace.it.com` shows Cloudflare 1016 / 522 | CNAME target typo | Target must be `sitetrace.pages.dev` (no `https://`, no trailing slash) |
| SSL stuck on "Pending" | DNS not propagated yet | Wait; check with `nslookup sitetrace.it.com 1.1.1.1` — should resolve to a Cloudflare IP |
| Site loads but styling is broken | `_headers` not picked up | Make sure `_headers` is at project root, redeploy |
