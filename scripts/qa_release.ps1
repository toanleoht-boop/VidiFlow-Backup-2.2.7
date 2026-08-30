[CmdletBinding()]
param([int]$Port = 3110)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$qaKey = 'VIDIFLOW-QA-LOCAL-ONLY'
$qaData = Join-Path $env:TEMP "vidiflow-release-qa-$PID"
$stdout = Join-Path $qaData 'server.stdout.log'
$stderr = Join-Path $qaData 'server.stderr.log'
$serverPid = 0
$previousEnvironment = @{
  PORT = $env:PORT
  NODE_ENV = $env:NODE_ENV
  VIDIFLOW_STATIC_SERVER = $env:VIDIFLOW_STATIC_SERVER
  VIDIFLOW_DATA_DIR = $env:VIDIFLOW_DATA_DIR
  VIDIFLOW_TEST_LICENSE_KEY = $env:VIDIFLOW_TEST_LICENSE_KEY
}

if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
  throw "QA port $Port is already in use."
}
New-Item -ItemType Directory -Path $qaData -Force | Out-Null

try {
  $env:PORT = [string]$Port
  $env:NODE_ENV = 'test'
  $env:VIDIFLOW_STATIC_SERVER = '1'
  $env:VIDIFLOW_DATA_DIR = $qaData
  $env:VIDIFLOW_TEST_LICENSE_KEY = $qaKey
  $node = (Get-Command node -ErrorAction Stop).Source
  $launcher = Start-Process -FilePath $node -ArgumentList 'dist\server.cjs' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  $serverPid = $launcher.Id
  $ready = $false
  for ($attempt = 0; $attempt -lt 80; $attempt += 1) {
    Start-Sleep -Milliseconds 250
    try {
      $health = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/launcher/status" -UseBasicParsing -TimeoutSec 2
      if ($health.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    if ($launcher.HasExited) { break }
  }
  if (-not $ready) {
    $detail = @()
    if (Test-Path $stdout) { $detail += Get-Content $stdout -Tail 80 }
    if (Test-Path $stderr) { $detail += Get-Content $stderr -Tail 80 }
    throw "Release QA server did not start.`r`n$($detail -join "`r`n")"
  }

  $previousBase = $env:QA_BASE_URL
  $previousKey = $env:QA_LICENSE_KEY
  $env:QA_BASE_URL = "http://127.0.0.1:$Port"
  $env:QA_LICENSE_KEY = $qaKey
  try {
    & node "$PSScriptRoot\qa_release.mjs"
    if ($LASTEXITCODE -ne 0) { throw "Release smoke tests failed: $LASTEXITCODE" }
  } finally {
    $env:QA_BASE_URL = $previousBase
    $env:QA_LICENSE_KEY = $previousKey
  }
} finally {
  if ($serverPid -gt 0) { Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue }
  if ($launcher -and -not $launcher.HasExited) { Stop-Process -Id $launcher.Id -Force -ErrorAction SilentlyContinue }
  foreach ($name in $previousEnvironment.Keys) {
    if ($null -eq $previousEnvironment[$name]) {
      Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue
    } else {
      Set-Item -Path "Env:$name" -Value $previousEnvironment[$name]
    }
  }
  Start-Sleep -Milliseconds 300
  if (Test-Path $qaData) { Remove-Item -LiteralPath $qaData -Recurse -Force -ErrorAction SilentlyContinue }
}
