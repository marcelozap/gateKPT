$ErrorActionPreference = "Stop"

$projectPath = Join-Path $PSScriptRoot "GateKPT.MusicOS.csproj"
$publishPath = Join-Path $PSScriptRoot "publish\win-x64"

dotnet publish $projectPath `
  --configuration Release `
  --runtime win-x64 `
  --self-contained false `
  --output $publishPath

Write-Host "Published GateKPT Music OS to $publishPath" -ForegroundColor Green
