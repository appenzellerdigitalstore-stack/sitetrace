# =============================================================
# SiteTrace — Launch Chrome (Profile 59 = Appenzeller Digital Store)
# with remote debugging enabled.
#
# IMPORTANT: Chrome 121+ refuses to enable remote debugging on
# the default User Data dir for security. We work around this
# by creating a directory junction (symlink) at a different
# path, so Chrome sees a non-default user-data-dir but the same
# actual files (your real logins, cookies, profiles).
# =============================================================
$ErrorActionPreference = 'Stop'

$Port        = 9222
$RealUserData = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data'
$Junction     = Join-Path $env:LOCALAPPDATA 'ChromeDebugJunction'
$ProfileName  = 'Profile 59'
$ProfileLabel = 'Appenzeller Digital Store'

# 1. Ensure junction exists
if (-not (Test-Path $Junction)) {
  Write-Host "[*] Creating directory junction..." -ForegroundColor Cyan
  Write-Host "    $Junction  ->  $RealUserData"
  & cmd /c mklink /J $Junction "$RealUserData" | Out-Null
  if (-not (Test-Path $Junction)) { Write-Host "[X] Junction failed" -ForegroundColor Red ; exit 1 }
} else {
  Write-Host "[*] Junction already exists: $Junction" -ForegroundColor Cyan
}

# 2. Verify profile exists under the junction
$profilePath = Join-Path $Junction $ProfileName
if (-not (Test-Path $profilePath)) {
  Write-Host "[X] Profile $ProfileName not found at $profilePath" -ForegroundColor Red
  Write-Host "    Edit this script to use a different profile." -ForegroundColor Yellow
  exit 1
}

# 3. Find chrome.exe
$candidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $null
foreach ($p in $candidates) { if (Test-Path $p) { $chrome = $p ; break } }
if (-not $chrome) { Write-Host "[X] Chrome not found" -ForegroundColor Red ; exit 1 }

# 4. Refuse to relaunch if Chrome is already running
$running = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue
if ($running) {
  Write-Host "[!] Chrome is still running. Close all windows first." -ForegroundColor Yellow
  exit 2
}

# 5. Launch
$args = @(
  "--remote-debugging-port=$Port"
  "--remote-allow-origins=*"
  "--user-data-dir=`"$Junction`""
  "--profile-directory=`"$ProfileName`""
)
Write-Host ""
Write-Host "[*] Chrome:        $chrome" -ForegroundColor Cyan
Write-Host "[*] Profile:       $ProfileLabel ($ProfileName)" -ForegroundColor Cyan
Write-Host "[*] User-data-dir: $Junction  (junction -> $RealUserData)" -ForegroundColor Cyan
Write-Host "[*] Debug port:    $Port" -ForegroundColor Cyan
Write-Host ""
Start-Process -FilePath $chrome -ArgumentList $args
Start-Sleep -Seconds 3

# 6. Verify
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/json/version" -UseBasicParsing -TimeoutSec 4
  $v = $r.Content | ConvertFrom-Json
  Write-Host "[OK] Chrome is listening on :$Port  ($($v.Browser))" -ForegroundColor Green
  Write-Host ""
  Write-Host "Drive it with:" -ForegroundColor Cyan
  Write-Host "  npm run bridge -- status" -ForegroundColor Green
  Write-Host "  npm run bridge -- tabs" -ForegroundColor Green
  Write-Host "  npm run bridge -- open <url>" -ForegroundColor Green
} catch {
  Write-Host "[!] Chrome didn't respond on the port." -ForegroundColor Yellow
}
