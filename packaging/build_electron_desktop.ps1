param(
  [string]$Version = '',
  [switch]$RequireSignature
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $Version) { $Version = (Get-Content (Join-Path $root 'version.json') -Raw | ConvertFrom-Json).version }
$tools = 'C:\tmp\vidiflow-electron-tools'
$stage = Join-Path $env:TEMP "vidiflow-electron-stage-$Version"
$out = Join-Path $env:TEMP "vidiflow-electron-release-$Version"
$iscc = Join-Path $env:LOCALAPPDATA 'Programs\Inno Setup 6\ISCC.exe'
if (-not (Test-Path "$tools\node_modules\electron")) { throw 'Electron tools are missing.' }
if (-not (Test-Path -LiteralPath $iscc)) { throw "Inno Setup was not found: $iscc" }
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
function Assert-NoBrowserProfiles([string]$scanRoot) {
  $profileDirectories = Get-ChildItem -LiteralPath $scanRoot -Directory -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^(User Data|chrome-dev-profile(?:-\d+)?|chrome-profile(?:-\d+)?)$' }
  $sensitiveFiles = Get-ChildItem -LiteralPath $scanRoot -File -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^(Cookies|Login Data|Web Data|Local State)$' }
  $blocked = @($profileDirectories) + @($sensitiveFiles)
  if ($blocked.Count -gt 0) {
    $details = ($blocked | Select-Object -First 20 -ExpandProperty FullName) -join "`r`n"
    throw "Browser profile data was found in the customer package:`r`n$details"
  }
}
Push-Location $root
try {
  # Call the compilers directly. In some Windows shells `npm run build`
  # stays alive after Vite has completed, which prevents the desktop package
  # from ever being created even though the source itself is valid.
  & "$root\node_modules\.bin\vite.cmd" build
  if ($LASTEXITCODE -ne 0) { throw "Vite build failed: $LASTEXITCODE" }
  & "$root\node_modules\.bin\esbuild.cmd" server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
  if ($LASTEXITCODE -ne 0) { throw "Server bundle failed: $LASTEXITCODE" }
  Copy-Item "$root\packaging\electron-main.cjs" "$stage\electron-main.cjs"
  # Only runtime modules belong in the customer package. Build tooling such as
  # Vite, TypeScript, tsx and esbuild is deliberately pruned after staging.
  $packageJson = @{
    name = 'vidiflow-oneclick'
    version = $Version
    main = 'electron-main.cjs'
    private = $true
    dependencies = @{
      '@google/genai' = '^2.4.0'
      'dotenv' = '^17.2.3'
      'express' = '^4.21.2'
      'ffmpeg-static' = '^5.3.0'
      'jszip' = '^3.10.1'
      'lodash' = '^4.18.1'
      'playwright' = '^1.61.1'
      'playwright-extra' = '^4.3.6'
      'puppeteer-extra-plugin-stealth' = '^2.11.2'
    }
    overrides = @{
      'body-parser' = '1.20.6'
      'protobufjs' = '7.6.5'
    }
  } | ConvertTo-Json -Depth 4
  [System.IO.File]::WriteAllText("$stage\package.json", $packageJson, (New-Object System.Text.UTF8Encoding($false)))
Copy-Item "$root\dist" "$stage\dist" -Recurse -Force
  # Vite already copies public assets into dist. Copy only the icon required
  # by Electron; copying the whole public tree duplicated large guides.
Copy-Item "$root\public\brand" "$stage\brand" -Recurse -Force
  $modules = Get-Item "$root\node_modules"; $moduleSource = if ($modules.LinkType) { $modules.Target[0] } else { $modules.FullName }
  robocopy $moduleSource "$stage\node_modules" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
  if ($LASTEXITCODE -gt 7) { throw "node_modules copy failed: $LASTEXITCODE" }
  Push-Location $stage
  try {
    & npm.cmd prune --omit=dev --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "Runtime dependency prune failed: $LASTEXITCODE" }
  } finally { Pop-Location }
  Copy-Item "$root\python_scripts" "$stage\python_scripts" -Recurse -Force
  Copy-Item "$root\capcut_ultra_tool.py" "$stage\capcut_ultra_tool.py" -Force
  # Social-link transcription must work on a clean customer machine. Bundle
  # yt-dlp instead of depending on a global Python installation/PATH entry.
  # Use the official standalone binary. The 100 KB Python Scripts launcher
  # works only on the build machine because it expects a separate Python
  # installation, so it must never be copied into a customer release.
  $ytDlp = "$root\packaging\runtime\yt-dlp.exe"
  if (-not (Test-Path -LiteralPath $ytDlp) -or (Get-Item -LiteralPath $ytDlp).Length -lt 5MB) {
    throw 'Standalone yt-dlp.exe is missing or invalid in packaging\runtime.'
  }
  $ytDlpVersion = & $ytDlp --version
  if ($LASTEXITCODE -ne 0 -or -not $ytDlpVersion) {
    throw 'Standalone yt-dlp.exe failed its self-check.'
  }
  New-Item -ItemType Directory -Path "$stage\bin" -Force | Out-Null
  Copy-Item -LiteralPath $ytDlp -Destination "$stage\bin\yt-dlp.exe" -Force
  # Bundle Whisper.cpp and its base model so voice alignment/dialogue analysis
  # work on a clean customer PC without Python, PyTorch, pip or model downloads.
  $whisperRuntime = "$root\packaging\runtime\whisper"
  $whisperCli = "$whisperRuntime\Release\whisper-cli.exe"
  $whisperModel = "$whisperRuntime\ggml-base.bin"
  if (-not (Test-Path -LiteralPath $whisperCli)) {
    throw 'Portable whisper-cli.exe is missing in packaging\runtime\whisper\Release.'
  }
  if (-not (Test-Path -LiteralPath $whisperModel) -or (Get-Item -LiteralPath $whisperModel).Length -lt 100MB) {
    throw 'Portable Whisper base model is missing or incomplete.'
  }
  New-Item -ItemType Directory -Path "$stage\runtime\whisper" -Force | Out-Null
  Copy-Item -LiteralPath "$whisperRuntime\Release" -Destination "$stage\runtime\whisper\Release" -Recurse -Force
  Copy-Item -LiteralPath $whisperModel -Destination "$stage\runtime\whisper\ggml-base.bin" -Force
  $pythonRuntime = "$root\windows_runtime\python"
  if (-not (Test-Path -LiteralPath "$pythonRuntime\python.exe")) {
    throw 'Portable python.exe is missing in windows_runtime\python.'
  }
  Copy-Item -LiteralPath $pythonRuntime -Destination "$stage\runtime\python" -Recurse -Force
  Copy-Item (Get-Command uv -ErrorAction Stop).Source "$stage\runtime\uv.exe" -Force
  # Never distribute browser runtimes, profiles, cookies, or signed-in Google
  # sessions. Playwright connects to the customer's locally installed Chrome.
  # Customer Chrome profiles are discovered locally at runtime from their own
  # machine and are never copied into the release.
  $profileNames = @('User Data', 'chrome-profiles', 'chrome-profile', 'Default', 'Profile 1', 'Profile 2', 'Profile 3')
  $profileSearchRoots = @("$stage\public", "$stage\brand", "$stage\python_scripts")
  foreach ($searchRoot in $profileSearchRoots) {
    if (-not (Test-Path -LiteralPath $searchRoot)) { continue }
    foreach ($profileName in $profileNames) {
      Get-ChildItem -LiteralPath $searchRoot -Directory -Recurse -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq $profileName } |
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
  if (Test-Path "$stage\dist\server.cjs.map") { Remove-Item "$stage\dist\server.cjs.map" -Force }
  [System.IO.File]::WriteAllText("$stage\NO_BROWSER_PROFILES.txt", "This release contains no browser runtime, Chrome profile, cookie, Google login, or customer browser data. VidiFlow uses Chrome installed on the customer's Windows device for browser automation.`r`n", (New-Object System.Text.UTF8Encoding($false)))
  Assert-NoBrowserProfiles $stage
  $electronVersion = & node -p "require('C:/tmp/vidiflow-electron-tools/node_modules/electron/package.json').version"
  & "$tools\node_modules\.bin\electron-packager.cmd" $stage 'VidiFlow OneClick' --platform=win32 --arch=x64 --electron-version=$electronVersion --out=$out --overwrite --no-asar --no-prune --icon="$root\favicon.ico"
  if ($LASTEXITCODE -ne 0) { throw "Electron packaging failed: $LASTEXITCODE" }
  $desktopDir = "$out\VidiFlow OneClick-win32-x64"
  Assert-NoBrowserProfiles "$desktopDir\resources\app"
  & $iscc "/DAppVersion=$Version" "/DSourceDir=$desktopDir" "$root\packaging\vidiflow-installer.iss"
  if ($LASTEXITCODE -ne 0) { throw "Inno Setup failed: $LASTEXITCODE" }
  $installerPath = "$root\release\VidiFlow-Setup-$Version.exe"
  & "$PSScriptRoot\write_release_manifest.ps1" -ArtifactPath $installerPath -Version $Version -Channel stable -RequireSignature:$RequireSignature
  if ($LASTEXITCODE -ne 0) { throw "Release manifest failed: $LASTEXITCODE" }
  Write-Host "Desktop app created: $desktopDir"
  Write-Host "Automatic-update installer created: $installerPath"
} finally { Pop-Location }
