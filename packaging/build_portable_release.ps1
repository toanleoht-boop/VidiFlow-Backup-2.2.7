param(
  [string]$Version = ""
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path -Parent $PSScriptRoot
if (-not $Version) { $Version = (Get-Content (Join-Path $root 'version.json') -Raw | ConvertFrom-Json).version }
$buildRoot = Join-Path $env:TEMP "vidiflow-portable-$Version"
$nuitkaRoot = Join-Path $buildRoot 'nuitka'
$releaseDir = Join-Path $root 'release'
$zipPath = Join-Path $releaseDir "VidiFlow-OneClick-Desktop-$Version-portable.zip"

if (Test-Path -LiteralPath $buildRoot) { Remove-Item -LiteralPath $buildRoot -Recurse -Force }
New-Item -ItemType Directory -Path $nuitkaRoot -Force | Out-Null
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

Push-Location $root
try {
  npm.cmd run build
  python -m nuitka --standalone --windows-console-mode=disable --assume-yes-for-downloads --output-dir=$nuitkaRoot --output-filename='VidiFlow OneClick.exe' packaging\vidiflow_launcher.py
  $launcherDist = Join-Path $nuitkaRoot 'vidiflow_launcher.dist'
  if (-not (Test-Path -LiteralPath $launcherDist)) { throw 'Nuitka did not create the launcher.' }

  $app = Join-Path $launcherDist 'app'
  New-Item -ItemType Directory -Path $app -Force | Out-Null
  $nodeModules = Get-Item (Join-Path $root 'node_modules')
  $nodeModulesSource = if ($nodeModules.LinkType) { $nodeModules.Target[0] } else { $nodeModules.FullName }
  Copy-Item (Join-Path $root 'dist') (Join-Path $app 'dist') -Recurse -Force
  Copy-Item (Join-Path $root 'public') (Join-Path $app 'public') -Recurse -Force
  Copy-Item $nodeModulesSource (Join-Path $app 'node_modules') -Recurse -Force
  Copy-Item (Join-Path $root 'python_scripts') (Join-Path $app 'python_scripts') -Recurse -Force
  Copy-Item (Join-Path $root 'capcut_ultra_tool.py') (Join-Path $app 'capcut_ultra_tool.py') -Force
  Copy-Item (Join-Path $root 'windows_runtime') (Join-Path $app 'runtime') -Recurse -Force
  $uvExe = (Get-Command uv -ErrorAction Stop).Source
  Copy-Item $uvExe (Join-Path $app 'runtime\uv.exe') -Force
  @{ version = $Version; built_at = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json | Set-Content (Join-Path $app 'version.json') -Encoding utf8

  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  Compress-Archive -Path $launcherDist -DestinationPath $zipPath -CompressionLevel Optimal
  $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $expected = @('vidiflow_launcher.dist\VidiFlow OneClick.exe','vidiflow_launcher.dist\app\dist\server.cjs','vidiflow_launcher.dist\app\runtime\node\node.exe','vidiflow_launcher.dist\app\runtime\uv.exe','vidiflow_launcher.dist\app\python_scripts\vieneu_worker.py')
    foreach ($entry in $expected) { if ($null -eq $archive.GetEntry($entry)) { throw "Portable ZIP verification failed: $entry is missing" } }
  } finally { $archive.Dispose() }
  $hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
  Set-Content -LiteralPath "$zipPath.sha256" -Value "$hash  $(Split-Path $zipPath -Leaf)" -Encoding ascii
  Write-Host "Portable ZIP completed: $zipPath"
  Write-Host "SHA256: $hash"
} finally {
  Pop-Location
}
