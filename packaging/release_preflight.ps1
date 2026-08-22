[CmdletBinding()]
param(
  [switch]$BuildInstaller,
  [switch]$RequireCleanTree,
  [switch]$RequireSignature
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$package = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
$versionFile = Get-Content -LiteralPath (Join-Path $root 'version.json') -Raw | ConvertFrom-Json
$lockPath = Join-Path $root 'package-lock.json'
$lockVersion = ([string](& node -e "const fs=require('fs'); console.log(JSON.parse(fs.readFileSync(process.argv[1],'utf8')).version)" $lockPath)).Trim()

if ($package.version -ne $versionFile.version -or $package.version -ne $lockVersion) {
  throw "Version mismatch: package=$($package.version), version.json=$($versionFile.version), lock=$lockVersion"
}
if ($RequireCleanTree) {
  $dirty = @(& git -C $root status --porcelain)
  if ($dirty.Count) {
    throw "Release requires a clean Git worktree. Commit or stash changes first."
  }
}

Push-Location $root
try {
  npm.cmd run check
  if ($LASTEXITCODE -ne 0) { throw "Quality checks failed: $LASTEXITCODE" }
  npm.cmd audit --omit=dev --audit-level=high
  if ($LASTEXITCODE -ne 0) { throw "Runtime dependency audit failed: $LASTEXITCODE" }
  npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "Production build failed: $LASTEXITCODE" }

  if ($BuildInstaller) {
    & "$PSScriptRoot\build_electron_desktop.ps1" -Version $package.version -RequireSignature:$RequireSignature
    if ($LASTEXITCODE -ne 0) { throw "Desktop installer build failed: $LASTEXITCODE" }
  } elseif ($RequireSignature) {
    throw "-RequireSignature must be used together with -BuildInstaller."
  }

  Write-Host "Release preflight passed for VidiFlow $($package.version)."
} finally {
  Pop-Location
}
