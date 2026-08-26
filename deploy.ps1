# =============================================================
# SiteTrace — One-shot deploy script (Windows / PowerShell)
# Usage:
#   $env:CLOUDFLARE_API_TOKEN = "your-token-here"
#   .\deploy.ps1
# =============================================================
$ErrorActionPreference = 'Stop'

$ProjectName = "sitetrace"
$RepoRoot    = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoRoot

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  SiteTrace --> Cloudflare Pages deploy"      -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ---- 1. Sanity checks ---------------------------------------
if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "[X] CLOUDFLARE_API_TOKEN is not set." -ForegroundColor Red
  Write-Host ""
  Write-Host "    1. Get a token at:  https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Yellow
  Write-Host "    2. Use the 'Edit Cloudflare Pages' template (or custom with Pages:Edit scope)" -ForegroundColor Yellow
  Write-Host "    3. Then run:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "       `$env:CLOUDFLARE_API_TOKEN = 'your-token-here'" -ForegroundColor Green
  Write-Host "       .\deploy.ps1" -ForegroundColor Green
  Write-Host ""
  exit 1
}

# Make sure wrangler is available
$wrangler = $null
try {
  $null = Get-Command wrangler -ErrorAction Stop
  $wrangler = "wrangler"
} catch {
  try {
    $null = & npx --version 2>$null
    if ($LASTEXITCODE -eq 0) { $wrangler = "npx wrangler" }
  } catch {}
}

if (-not $wrangler) {
  Write-Host "[X] Wrangler not found. Install with:  npm install" -ForegroundColor Red
  exit 1
}

Write-Host "[1/3] Validating project files..." -ForegroundColor Cyan
foreach ($f in @("index.html", "styles.css", "js/app.js", "js/i18n.js", "js/ping.js", "js/dns.js", "wrangler.toml")) {
  if (-not (Test-Path $f)) { Write-Host "[X] Missing: $f" -ForegroundColor Red ; exit 1 }
}
Write-Host "      OK" -ForegroundColor Green

Write-Host ""
Write-Host "[2/3] Deploying to Cloudflare Pages (project: $ProjectName)..." -ForegroundColor Cyan
& $wrangler.Split(' ') pages deploy . --project-name=$ProjectName --commit-dirty=true
if ($LASTEXITCODE -ne 0) {
  Write-Host "[X] Deploy failed." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[3/3] Done." -ForegroundColor Green
Write-Host ""
Write-Host "  --> https://$ProjectName.pages.dev is now live (or updated)." -ForegroundColor White
Write-Host ""
Write-Host "  Next: wire the custom domain sitetrace.it.com" -ForegroundColor Yellow
Write-Host "  1. Open:  https://dash.cloudflare.com/ --> Workers & Pages --> $ProjectName --> Custom domains" -ForegroundColor Yellow
Write-Host "  2. Click 'Set up a custom domain' and enter: sitetrace.it.com" -ForegroundColor Yellow
Write-Host "  3. Cloudflare will show the CNAME target. Add it at Namecheap:" -ForegroundColor Yellow
Write-Host "        Type:  CNAME  |  Host: sitetrace  |  Target: $ProjectName.pages.dev  |  TTL: Automatic" -ForegroundColor Green
Write-Host "  4. Wait 1-5 min for DNS to propagate, then SSL is auto-issued." -ForegroundColor Yellow
Write-Host ""
