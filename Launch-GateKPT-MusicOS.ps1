$ErrorActionPreference = "Stop"

$projectPath = Join-Path $PSScriptRoot "GateKPT.MusicOS.csproj"

Start-Process -FilePath "dotnet" `
  -ArgumentList @("run", "--project", $projectPath) `
  -WorkingDirectory $PSScriptRoot `
  -WindowStyle Hidden
