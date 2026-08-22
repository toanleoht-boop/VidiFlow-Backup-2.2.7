@echo off
set "URL=http://127.0.0.1:3105/media-only.html"
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 '%URL%' | Out-Null; Start-Process '%URL%' } catch { Write-Host 'VidiFlow 2.2.7 chua chay tai cong 3105.' -ForegroundColor Yellow; Write-Host 'Hay mo VidiFlow truoc, sau do chay lai file nay.'; Read-Host 'Nhan Enter de dong' }"
