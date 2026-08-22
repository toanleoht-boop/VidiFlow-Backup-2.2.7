param([switch]$SkipBrowserRuntime)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot; $out = Join-Path $root 'release\VidiFlow-OneClick-Desktop-Windows'
$nodeHome = Split-Path -Parent ((Get-Command node).Source); $browserHome = Join-Path $env:LOCALAPPDATA 'ms-playwright'
$nodeModulesLink = Get-Item (Join-Path $root 'node_modules'); $nodeModulesSource = if ($nodeModulesLink.LinkType) { $nodeModulesLink.Target[0] } else { $nodeModulesLink.FullName }
if (Test-Path $out) { Remove-Item -LiteralPath $out -Recurse -Force }; New-Item -ItemType Directory -Path $out -Force | Out-Null
Push-Location $root
try {
  npm.cmd run build
  python -m nuitka --standalone --windows-console-mode=disable --assume-yes-for-downloads --include-module=webview.platforms.winforms --include-module=webview.platforms.edgechromium --include-package=clr_loader --include-package=clr --include-package=pythonnet --include-package=proxy_tools --output-dir=$out --output-filename='VidiFlow OneClick.exe' packaging\vidiflow_launcher.py
  $launcherDist = Join-Path $out 'vidiflow_launcher.dist'; if (-not (Test-Path $launcherDist)) { throw 'Nuitka did not create the launcher.' }
  $stage = Join-Path $launcherDist 'app'
  New-Item -ItemType Directory -Path $stage -Force | Out-Null
  Copy-Item (Join-Path $root 'dist') (Join-Path $stage 'dist') -Recurse -Force; Copy-Item (Join-Path $root 'public') (Join-Path $stage 'public') -Recurse -Force
  Copy-Item $nodeModulesSource (Join-Path $stage 'node_modules') -Recurse -Force; Copy-Item (Join-Path $root 'python_scripts') (Join-Path $stage 'python_scripts') -Recurse -Force
  New-Item -ItemType Directory -Path (Join-Path $stage 'runtime') -Force | Out-Null; Copy-Item $nodeHome (Join-Path $stage 'runtime\node') -Recurse -Force
  Copy-Item (Get-Command uv -ErrorAction Stop).Source (Join-Path $stage 'runtime\uv.exe') -Force
  if (-not $SkipBrowserRuntime) { Copy-Item $browserHome (Join-Path $stage 'runtime\playwright-browsers') -Recurse -Force }
  "Extract the entire folder, then open vidiflow_launcher.dist\VidiFlow OneClick.exe. The test package does not contain API keys." | Set-Content (Join-Path $out 'README-TEST.txt') -Encoding utf8
  Write-Host "Test package created: $out"
} finally { Pop-Location }
