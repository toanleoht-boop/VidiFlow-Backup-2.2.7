param(
  [string]$BaseUrl = "http://localhost:3100",
  [string]$OutputDir = "public/style-demos"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $destination | Out-Null

$styles = @(
  @{ file = "01-cinematic.jpg"; prompt = "A lone traveler walking through a rain-soaked old Hanoi street at blue hour, warm lantern reflections, no text, no logo"; style = "cinematic photorealistic, dramatic lighting, shallow depth of field, highly detailed, professional color grading" },
  @{ file = "02-3d-animation.jpg"; prompt = "A cheerful young explorer discovering a glowing forest map with friendly animal companions, no text, no logo"; style = "high quality stylized 3D animation, expressive characters, soft global illumination, colorful family-friendly look" },
  @{ file = "03-chibi.jpg"; prompt = "A tiny chibi chef trying to hold an enormous steaming bowl of pho, playful surprised expression, no text, no logo"; style = "cute chibi cartoon, oversized head, simple expressive face, clean outlines, colorful humorous storytelling" },
  @{ file = "04-anime.jpg"; prompt = "A determined schoolgirl on a rooftop at sunset with wind lifting her scarf, distant city skyline, no text, no logo"; style = "cinematic anime illustration, detailed background, dynamic composition, dramatic rim light, polished animation frame" },
  @{ file = "05-watercolor.jpg"; prompt = "A peaceful riverside village with a small wooden boat and lotus flowers in early morning mist, no text, no logo"; style = "dreamy watercolor illustration, soft paper texture, delicate brush strokes, pastel palette, warm emotional atmosphere" },
  @{ file = "06-chalkboard.jpg"; prompt = "A visual idea of growth: a simple hand-drawn staircase rising toward a star on a blackboard, no words, no text"; style = "minimalist chalkboard illustration, hand-drawn white chalk lines, dark blackboard texture, simple conceptual composition" },
  @{ file = "07-comic.jpg"; prompt = "A masked detective leaping between city rooftops while chasing a shadowy thief, action scene, no text, no logo"; style = "classic comic book art, bold ink outlines, halftone texture, dynamic panels, vivid limited color palette" },
  @{ file = "08-gothic.jpg"; prompt = "An abandoned Victorian mansion on a foggy hill beneath a pale moon, mysterious silhouette at the gate, no text, no logo"; style = "dark gothic horror illustration, eerie fog, deep shadows, desaturated palette, ominous cinematic lighting" },
  @{ file = "09-historical.jpg"; prompt = "Ancient Vietnamese warriors crossing a mountain pass at sunrise with banners flying, grand wide scene, no text, no logo"; style = "epic historical cinematic painting, authentic period costumes, monumental environment, dramatic golden light, rich detail" },
  @{ file = "10-documentary.jpg"; prompt = "A candid Vietnamese craftswoman weaving bamboo by a sunlit window in her workshop, authentic daily life, no text, no logo"; style = "authentic documentary photography, natural available light, realistic environment, candid composition, neutral color grade" },
  @{ file = "11-cyberpunk.jpg"; prompt = "A futuristic motorbike courier riding through a neon rainy city at night, reflections on the road, no text, no logo"; style = "cyberpunk futuristic city, neon magenta and cyan lights, rainy atmosphere, high-tech details, cinematic sci-fi composition" },
  @{ file = "12-claymation.jpg"; prompt = "A small clay robot planting a bright flower in a miniature garden, charming scene, no text, no logo"; style = "handcrafted claymation style, tactile clay texture, miniature set, soft studio lighting, charming stop-motion aesthetic" },
  @{ file = "13-paper-cut.jpg"; prompt = "Layered mountains, clouds, sun and birds creating a hopeful journey landscape, no text, no logo"; style = "layered paper cut illustration, visible paper fibers, clean shapes, soft cast shadows, elegant educational composition" },
  @{ file = "14-low-poly.jpg"; prompt = "A geometric fox standing on a crystal rock in a snowy valley under northern lights, no text, no logo"; style = "stylized low-poly 3D art, geometric shapes, clean facets, modern color palette, crisp studio lighting" },
  @{ file = "15-vintage-80s.jpg"; prompt = "A young musician listening to a cassette player beside a classic car at a neon roadside diner, no text, no logo"; style = "1980s vintage film still, warm faded colors, analog grain, retro wardrobe and production design, nostalgic cinematic mood" }
)
$statusPath = Join-Path $root "temp/style-demo-generation-status.json"
$results = @()
$ports = @(9222, 9224, 9225)
$worker = {
  param($item, $port, $BaseUrl, $target)
  try {
    # Ảnh demo chỉ gửi đúng mô tả phong cách, như cách tạo mẫu trong Google Labs.
    $simpleStylePrompt = "$($item.style), 16:9"
    $payload = @{ prompt = $simpleStylePrompt; style = $item.style; bypassCache = $true; visualConfig = @{ generationMode = "labs-flow"; generateType = "Image"; aspectRatio = "16:9"; imageGeneratorEngine = "Nano Banana 2 Lite"; chromeHeadless = $false; chromeProfiles = @(@{ port = $port; active = $true }) } } | ConvertTo-Json -Depth 8
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/pipeline/generate-image" -Method Post -ContentType "application/json" -Body $payload -TimeoutSec 360
    if (-not $response.success -or -not $response.fallbackUrl) { throw $(if ($response.warning) { $response.warning } else { "Không nhận được URL ảnh" }) }
    if ($response.fallbackUrl -match '^data:image/[^;]+;base64,(.+)$') { [System.IO.File]::WriteAllBytes($target, [System.Convert]::FromBase64String($Matches[1])) } else { Invoke-WebRequest -UseBasicParsing -Uri $response.fallbackUrl -OutFile $target -TimeoutSec 120 }
    [pscustomobject]@{ file = $item.file; status = "complete"; error = ""; port = $port }
  } catch { [pscustomobject]@{ file = $item.file; status = "error"; error = $_.Exception.Message; port = $port } }
}

for ($offset = 0; $offset -lt $styles.Count; $offset += $ports.Count) {
  $batch = @()
  for ($slot = 0; $slot -lt $ports.Count -and ($offset + $slot) -lt $styles.Count; $slot++) {
    $item = $styles[$offset + $slot]
    $entry = [ordered]@{ file = $item.file; status = "generating"; error = ""; port = $ports[$slot] }
    $results += $entry
    $job = Start-Job -ScriptBlock $worker -ArgumentList $item, $ports[$slot], $BaseUrl, (Join-Path $destination $item.file)
    $batch += @{ Job = $job; Entry = $entry }
  }
  @{ total = $styles.Count; completed = @($results | Where-Object { $_.status -eq "complete" }).Count; current = ($batch.Entry.file -join ", "); items = $results } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 $statusPath
  foreach ($pending in $batch) { $result = Receive-Job -Job (Wait-Job -Job $pending.Job) | Select-Object -First 1; $pending.Entry.status = $result.status; $pending.Entry.error = $result.error; Remove-Job -Job $pending.Job -Force }
  @{ total = $styles.Count; completed = @($results | Where-Object { $_.status -eq "complete" }).Count; current = ""; items = $results } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 $statusPath
}
