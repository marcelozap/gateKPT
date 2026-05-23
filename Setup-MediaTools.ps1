$ErrorActionPreference = "Stop"

Write-Host "Checking GateKPT Music OS media toolchain..." -ForegroundColor Cyan

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue

if ($ffmpeg -and $ffprobe) {
  Write-Host "FFmpeg and FFprobe are already available." -ForegroundColor Green
  ffmpeg -version | Select-Object -First 1
  exit 0
}

Write-Host "FFmpeg or FFprobe is missing." -ForegroundColor Yellow
Write-Host "Install with:" -ForegroundColor Cyan
Write-Host "  winget install Gyan.FFmpeg" -ForegroundColor White
Write-Host ""
Write-Host "After install, restart GateKPT Music OS so the app can see the updated PATH." -ForegroundColor Cyan
