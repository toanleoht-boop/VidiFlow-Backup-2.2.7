param(
  [string]$Version = "",
  [switch]$RequireSignature
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $Version) { $Version = (Get-Content (Join-Path $root 'version.json') -Raw | ConvertFrom-Json).version }
$releaseRoot = 'C:\tmp\vidiflow-nuitka-build'
$nuitkaOutput = Join-Path $releaseRoot "nuitka"
$iscc = Join-Path $env:LOCALAPPDATA "Programs\Inno Setup 6\ISCC.exe"

if (-not (Test-Path -LiteralPath $iscc)) { throw "Inno Setup was not found: $iscc" }
if ($Version -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') { throw "Version must use the format 1.0.0" }

$nodeModules = Get-Item (Join-Path $root 'node_modules')
$nodeModulesSource = if ($nodeModules.LinkType) { $nodeModules.Target[0] } else { $nodeModules.FullName }

if (Test-Path -LiteralPath $releaseRoot) { Remove-Item -LiteralPath $releaseRoot -Recurse -Force }
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null

Push-Location $root
try {
  npm.cmd run build
  python -m nuitka --standalone --windows-console-mode=disable --assume-yes-for-downloads --output-dir=$nuitkaOutput --output-filename='VidiFlow OneClick.exe' packaging\vidiflow_launcher.py

  $launcherDist = Join-Path $nuitkaOutput 'vidiflow_launcher.dist'
  if (-not (Test-Path -LiteralPath $launcherDist)) { throw 'Nuitka did not create the launcher.' }
  Copy-Item (Join-Path $root 'legal') (Join-Path $launcherDist 'legal') -Recurse -Force
  Copy-Item (Join-Path $root "CHANGELOG-$Version.txt") (Join-Path $launcherDist 'CHANGELOG.txt') -Force
  $app = Join-Path $launcherDist 'app'
  New-Item -ItemType Directory -Path $app -Force | Out-Null
  Copy-Item (Join-Path $root 'dist') (Join-Path $app 'dist') -Recurse -Force
  Copy-Item (Join-Path $root 'public') (Join-Path $app 'public') -Recurse -Force
  Copy-Item $nodeModulesSource (Join-Path $app 'node_modules') -Recurse -Force
  Copy-Item (Join-Path $root 'python_scripts') (Join-Path $app 'python_scripts') -Recurse -Force
  Copy-Item (Join-Path $root 'capcut_ultra_tool.py') (Join-Path $app 'capcut_ultra_tool.py') -Force
  Copy-Item (Join-Path $root 'windows_runtime') (Join-Path $app 'runtime') -Recurse -Force
  $uvExe = (Get-Command uv -ErrorAction Stop).Source
  Copy-Item $uvExe (Join-Path $app 'runtime\uv.exe') -Force
  $binDir = Join-Path $app 'bin'
  New-Item -ItemType Directory -Path $binDir -Force | Out-Null
  Copy-Item (Join-Path $root 'packaging\runtime\yt-dlp.exe') (Join-Path $binDir 'yt-dlp.exe') -Force
  $whisperDir = Join-Path $app 'runtime\whisper'
  New-Item -ItemType Directory -Path $whisperDir -Force | Out-Null
  Copy-Item (Join-Path $root 'packaging\runtime\whisper\Release') (Join-Path $whisperDir 'Release') -Recurse -Force
  Copy-Item (Join-Path $root 'packaging\runtime\whisper\ggml-base.bin') (Join-Path $whisperDir 'ggml-base.bin') -Force
  @{ version = $Version; built_at = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content (Join-Path $app 'version.json') -Encoding utf8

  & $iscc "/DAppVersion=$Version" "/DSourceDir=$launcherDist" "/DOutputSuffix=-legacy-nuitka" (Join-Path $PSScriptRoot 'vidiflow-installer.iss')
  if ($LASTEXITCODE -ne 0) { throw "Inno Setup exited with code $LASTEXITCODE" }
  $installerPath = Join-Path $root "release\VidiFlow-Setup-$Version-legacy-nuitka.exe"
  & "$PSScriptRoot\write_release_manifest.ps1" -ArtifactPath $installerPath -Version $Version -Channel legacy-nuitka -RequireSignature:$RequireSignature
  Write-Host "Legacy Nuitka installer completed: $installerPath"
} finally {
  Pop-Location
}
