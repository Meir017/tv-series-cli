# Quick Reference - PowerShell Download Script

## File
- **Location:** `download-tv.ps1`
- **Size:** ~4.8 KB
- **Terminal Only:** Pure terminal menu (no GUI)

## Quick Start

```powershell
# Interactive - shows menu, ask for selection
.\download-tv.ps1

# Non-interactive - auto-selects first series
.\download-tv.ps1 -NoPrompt

# Custom download folder
.\download-tv.ps1 -DownloadDir "C:\Videos"
```

## Terminal Menu

```
🎬 TV Series CLI - URL Selector
================================

Available series:
  [1] The Amazing Race - Mako
  [2] Games of Chef - 13TV (Season 8)
  [3] Games of Chef - 13TV (Season 7)
  [4] Yummies - 13TV

Select series (1-4) or press Ctrl+C to cancel: _
```

Type **1**, **2**, **3**, or **4** and press Enter.

## Confirmation

After selection:
```
Selected: Games of Chef - 13TV (Season 8)
URL: https://13tv.co.il/yummies/games-of-chef/season-08/episodes/
Download to: ./downloads

Proceed? (y/n): _
```

Type **y** to start download, **n** to cancel.

## Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `-NoPrompt` | (flag) | Skip menu/confirmation, auto-select first series |
| `-DownloadDir` | `./downloads` | Output directory for videos |

Examples:
```powershell
.\download-tv.ps1 -NoPrompt
.\download-tv.ps1 -DownloadDir "D:\TV"
.\download-tv.ps1 -DownloadDir "D:\TV" -NoPrompt
```

## Execution Policy

If script won't run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or run with bypass:
```powershell
powershell -ExecutionPolicy Bypass -Command "& { .\download-tv.ps1 }"
```

## Series List

```
[1] The Amazing Race - Mako
    → https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2

[2] Games of Chef - 13TV (Season 8)
    → https://13tv.co.il/yummies/games-of-chef/season-08/episodes/

[3] Games of Chef - 13TV (Season 7)
    → https://13tv.co.il/yummies/games-of-chef/season-07/episodes/

[4] Yummies - 13TV
    → https://13tv.co.il/yummies/
```

## Common Commands

```powershell
# Run interactively
.\download-tv.ps1

# Run non-interactive to Mako series
.\download-tv.ps1 -NoPrompt

# Run to custom folder
.\download-tv.ps1 -DownloadDir "C:\Videos" -NoPrompt

# Check last exit code
$LASTEXITCODE
```

## Exit Codes

- **0** = Success or cancelled
- **1** = Error

## What Happens

1. **Show Menu** → 4 series options
2. **Get Selection** → Enter number (1-4)
3. **Show Details** → Display URL and destination
4. **Confirm** → Ask "Proceed? (y/n)"
5. **Execute** → Runs `bun run src/index.ts "<URL>" "<DIR>" [-n]`
6. **Download** → Interactive CLI menu for video selection
7. **Exit** → Returns exit code 0 or 1

## Editing Series

Add more series to `$SeriesUrls` in `download-tv.ps1`:

```powershell
$SeriesUrls = @(
    @{ Name = "Series Name"; Url = "https://url.com" },
    @{ Name = "New Series"; Url = "https://new-url.com" }
)
```

## Troubleshooting

**Script won't run:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**bun not found:**
```powershell
bun --version  # Check if installed
# Install: https://bun.sh
```

**Invalid selection error:**
- Must enter 1, 2, 3, or 4
- Press Enter after number
- Use Ctrl+C to cancel
