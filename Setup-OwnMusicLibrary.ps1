$ErrorActionPreference = "Stop"

$musicRoot = [Environment]::GetFolderPath("MyMusic")
$libraryRoot = Join-Path $musicRoot "XIV Music Library\GateKPT Own Library"

$folders = @(
    "00 Inbox - Drop New Audio Here",
    "01 Loops\Guitar",
    "01 Loops\Piano",
    "01 Loops\RC-505",
    "01 Loops\Drums",
    "02 Song Seeds\Hooks",
    "02 Song Seeds\Voice Memos",
    "02 Song Seeds\Demos",
    "03 Backgrounds\Rain",
    "03 Backgrounds\Night Drive",
    "03 Backgrounds\Balcony Morning",
    "03 Backgrounds\Warm Room",
    "03 Backgrounds\Focus Pads",
    "04 Personal Mixes\Gym",
    "04 Personal Mixes\Work Focus",
    "04 Personal Mixes\Smoke Window",
    "04 Personal Mixes\Night Drive",
    "04 Personal Mixes\Sleep Reset",
    "05 Performance Clips\GateKPT Screen Recordings",
    "05 Performance Clips\One Take Guitar",
    "05 Performance Clips\Vocal Passes",
    "05 Performance Clips\Loop Builds",
    "06 Downloadable Packs",
    "07 Weekly Exports",
    "_Playlists"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path (Join-Path $libraryRoot $folder) | Out-Null
}

$readme = @"
# GateKPT Own Library

This is the private listening library.

The goal is simple:

Open my own folder. Play my own work. Keep building.

## Weekly Minimum

- 3 short loops
- 1 rough song idea
- 1 background audio bed
- 1 personal mix export

## 30-Day Target

- 100+ personal audio files
- 10+ loop ideas
- 5+ song seeds
- 5+ background beds
- 3+ personal mixes

## File Names

Use:

YYYY-MM-DD-description-##.wav

Examples:

2026-06-11-night-guitar-loop-01.wav
2026-06-11-balcony-drone-01.wav
2026-06-11-work-focus-mix-01.wav

## Rule

Record something. Save it. Listen to it later.

I do not need to rent music all day. I can build the room I listen to.
"@

Set-Content -LiteralPath (Join-Path $libraryRoot "README.md") -Value $readme -Encoding UTF8

$today = Get-Date -Format "yyyy-MM-dd"
$weeklyPlan = @"
# Weekly Own Library Plan - $today

Minimum:

- [ ] Loop 1
- [ ] Loop 2
- [ ] Loop 3
- [ ] Song seed
- [ ] Background bed
- [ ] Personal mix

Notes:

- What did I actually want to replay?
- What sounded like me?
- What folder needs more material?
"@

Set-Content -LiteralPath (Join-Path $libraryRoot "07 Weekly Exports\$today-weekly-plan.md") -Value $weeklyPlan -Encoding UTF8

$playlistFiles = @{
    "gym.m3u" = @(
        "#EXTM3U",
        "# Drop gym loops or mixes below."
    )
    "work-focus.m3u" = @(
        "#EXTM3U",
        "# Drop focus pads, drones, and soft loops below."
    )
    "night-drive.m3u" = @(
        "#EXTM3U",
        "# Drop night drive mixes below."
    )
    "sleep-reset.m3u" = @(
        "#EXTM3U",
        "# Drop sleep/reset backgrounds below."
    )
}

foreach ($playlist in $playlistFiles.GetEnumerator()) {
    Set-Content -LiteralPath (Join-Path $libraryRoot "_Playlists\$($playlist.Key)") -Value $playlist.Value -Encoding UTF8
}

$shortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "GateKPT Own Library.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $libraryRoot
$shortcut.WorkingDirectory = $libraryRoot
$shortcut.Description = "Open the GateKPT Own Library"
$shortcut.Save()

Write-Host "GateKPT Own Library ready:" -ForegroundColor Green
Write-Host $libraryRoot
Write-Host "Desktop shortcut:" -ForegroundColor Green
Write-Host $shortcutPath
