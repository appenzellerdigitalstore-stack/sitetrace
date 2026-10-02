# =============================================================
# SiteTrace — Start Microsoft Edge with remote debugging enabled.
# Launches Edge with an isolated profile (no shared cookies, history,
# passwords, or extensions from your regular Edge). The agent
# (browser-bridge.cjs) connects to http://localhost:9223 over CDP.
#
# Usage:
#   pwsh ./scripts/start-edge-debug.ps1
#   # or right-click → Run with PowerShell
#
# To stop:
#   Close the Edge window, or kill msedge.exe in Task Manager.
#
# This script does NOT require admin rights. The profile dir is
# created automatically under %USERPROFILE%\.minimax\.
# =============================================================

$ErrorActionPreference = 'Stop'

$edgePathCandidates = @(
    "$env:ProgramFiles (x86)\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe"
)

$edge = $edgePathCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
    Write-Error "Microsoft Edge was not found. Tried:`n  $($edgePathCandidates -join "`n  ")"
    exit 1
}

$profileDir = Join-Path $env:USERPROFILE '.minimax\edge-automation-profile'
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$port = 9223
$args = @(
    "--remote-debugging-port=$port"
    "--user-data-dir=$profileDir"
    '--remote-allow-origins=*'
    '--no-first-run'
    '--no-default-browser-check'
    '--disable-features=Translate,EdgeAutoUpdate'
    'about:blank'
)

Write-Host ""
Write-Host "Edge debug session starting" -ForegroundColor Cyan
Write-Host "  exe:       $edge"
Write-Host "  port:      $port"
Write-Host "  profile:   $profileDir"
Write-Host "  CDP:       http://localhost:$port/json/version"
Write-Host ""
Write-Host "To stop: close the Edge window or run:"
Write-Host "  Stop-Process -Name msedge"
Write-Host ""

Start-Process -FilePath $edge -ArgumentList $args
Write-Host "Edge launched." -ForegroundColor Green
