[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ArtifactPath,
  [Parameter(Mandatory = $true)]
  [string]$Version,
  [ValidateSet('stable', 'legacy-nuitka')]
  [string]$Channel = 'stable',
  [switch]$RequireSignature
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$artifact = [IO.Path]::GetFullPath($ArtifactPath)
if (-not (Test-Path -LiteralPath $artifact -PathType Leaf)) {
  throw "Release artifact not found: $artifact"
}
if ($Version -notmatch '^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$') {
  throw "Version must use semantic versioning: $Version"
}

$thumbprint = ([string]$env:VIDIFLOW_SIGN_CERT_SHA1).Replace(' ', '').Trim()
if ($thumbprint) {
  $signTool = ([string]$env:VIDIFLOW_SIGNTOOL_PATH).Trim()
  if (-not $signTool) {
    $kitsRoot = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\bin'
    $candidate = Get-ChildItem -LiteralPath $kitsRoot -Filter signtool.exe -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match '\\x64\\signtool\.exe$' } |
      Sort-Object FullName -Descending |
      Select-Object -First 1
    if ($candidate) { $signTool = $candidate.FullName }
  }
  if (-not $signTool -or -not (Test-Path -LiteralPath $signTool -PathType Leaf)) {
    throw 'VIDIFLOW_SIGN_CERT_SHA1 is configured but signtool.exe was not found.'
  }
  $timestampUrl = ([string]$env:VIDIFLOW_TIMESTAMP_URL).Trim()
  if (-not $timestampUrl) { $timestampUrl = 'http://timestamp.digicert.com' }
  & $signTool sign /sha1 $thumbprint /fd SHA256 /td SHA256 /tr $timestampUrl $artifact
  if ($LASTEXITCODE -ne 0) { throw "signtool exited with code $LASTEXITCODE" }
}

$signature = Get-AuthenticodeSignature -LiteralPath $artifact
if ($RequireSignature -and $signature.Status -ne 'Valid') {
  throw "Customer release requires a valid Authenticode signature. Current status: $($signature.Status)"
}

$hash = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToUpperInvariant()
$item = Get-Item -LiteralPath $artifact
$commit = ''
try { $commit = ([string](& git -C $root rev-parse HEAD 2>$null)).Trim() } catch {}
$builtAt = (Get-Date).ToUniversalTime().ToString('o')
$suffix = if ($Channel -eq 'stable') { '' } else { "-$Channel" }
$shaPath = Join-Path $item.DirectoryName "SHA256-$Version$suffix.txt"
$manifestPath = Join-Path $item.DirectoryName "release-manifest-$Version$suffix.json"
$utf8 = New-Object Text.UTF8Encoding($false)

[IO.File]::WriteAllText(
  $shaPath,
  "$hash  $($item.Name)`r`n",
  $utf8
)

$manifest = [ordered]@{
  schemaVersion = 1
  product = 'VidiFlow OneClick Content Studio'
  version = $Version
  channel = $Channel
  builtAt = $builtAt
  gitCommit = $commit
  artifact = [ordered]@{
    name = $item.Name
    bytes = $item.Length
    sha256 = $hash
    signatureStatus = [string]$signature.Status
    signer = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null }
    timestampSigner = if ($signature.TimeStamperCertificate) { $signature.TimeStamperCertificate.Subject } else { $null }
  }
}
[IO.File]::WriteAllText(
  $manifestPath,
  ($manifest | ConvertTo-Json -Depth 6),
  $utf8
)

Write-Host "Release SHA256: $hash"
Write-Host "Signature: $($signature.Status)"
Write-Host "Manifest: $manifestPath"
return [pscustomobject]@{
  ArtifactPath = $artifact
  Sha256Path = $shaPath
  ManifestPath = $manifestPath
  SignatureStatus = [string]$signature.Status
}
