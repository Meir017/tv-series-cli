# TV Series CLI - PowerShell Download Script

Terminal-based interactive PowerShell script for selecting and downloading TV series.

## Features

✅ **Terminal Menu** - Pure terminal-based selection (no GUI)  
✅ **Numeric Selection** - Type 1-4 to choose series  
✅ **Non-Interactive Mode** - Auto-download with `-NoPrompt` flag  
✅ **Confirmation Prompt** - Review selection before downloading  
✅ **Custom Directory** - Specify output folder with `-DownloadDir`  
✅ **Cross-Platform** - Works on Windows, macOS, Linux (with PowerShell 5.1+)  

## Usage

### Interactive Mode (Default)

```powershell
.\download-tv.ps1
```

Displays numbered menu → Select with number (1-4) + Enter → Confirm with y/n → Download starts

### Non-Interactive Mode (Auto-download first series)

```powershell
.\download-tv.ps1 -NoPrompt
```

Automatically selects first series and starts download without prompts.

### Custom Download Directory

Specify where to save videos:

```powershell
.\download-tv.ps1 -DownloadDir "C:\Videos"
.\download-tv.ps1 -DownloadDir "./my-downloads" -NoPrompt
```

## Available Series

The script includes these pre-configured URLs:

| # | Name | Network |
|---|------|---------|
| 1 | The Amazing Race - Mako | Mako |
| 2 | Games of Chef - 13TV (Season 8) | 13TV |
| 3 | Games of Chef - 13TV (Season 7) | 13TV |
| 4 | Yummies - 13TV | 13TV |

## Terminal Menu Example

```
🎬 TV Series CLI - URL Selector
================================

Available series:
  [1] The Amazing Race - Mako
  [2] Games of Chef - 13TV (Season 8)
  [3] Games of Chef - 13TV (Season 7)
  [4] Yummies - 13TV

Select series (1-4) or press Ctrl+C to cancel: 2

Selected: Games of Chef - 13TV (Season 8)
URL: https://13tv.co.il/yummies/games-of-chef/season-08/episodes/
Download to: ./downloads

Proceed? (y/n): y

🚀 Starting download...

🎬 TV Series CLI - Video Downloader
📡 Scraping videos...
...
```

## Adding More Series

Edit the `$SeriesUrls` array in `download-tv.ps1`:

```powershell
$SeriesUrls = @(
    @{
        Name = "Your Series Name"
        Url = "https://your-series-url.com"
    },
    # Add more like this:
)
```

## Execution Policy

If the script won't run due to execution policy:

```powershell
# Check current policy
Get-ExecutionPolicy

# Set for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run directly with bypass
powershell -ExecutionPolicy Bypass -Command "& { .\download-tv.ps1 }"
```

## Examples

### Select interactively and download

```powershell
.\download-tv.ps1
# Type: 2
# Type: y
# Downloads start
```

### Auto-download to custom folder

```powershell
.\download-tv.ps1 -NoPrompt -DownloadDir "D:\TV"
```

### Auto-download with default folder

```powershell
.\download-tv.ps1 -NoPrompt
```

## Error Handling

- **Invalid selection** → "Invalid selection. Please enter..." → prompts again
- **Download cancelled** → Shows "❌ Download cancelled." → exit code 0
- **Download failed** → Shows "❌ Download failed with exit code: X"
- **Script error** → Shows "❌ Error: [message]" → exit code 1

## Return Codes

| Code | Meaning |
|------|---------|
| 0 | Success or intentional cancellation |
| 1 | Error occurred |

Check with: `echo $LASTEXITCODE`

## Troubleshooting

### Script won't run
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### bun command not found
Ensure bun is installed and in your PATH:
```powershell
bun --version
```

If not installed: https://bun.sh

### Selection doesn't work
- Make sure you're entering a valid number (1-4)
- Press Enter after the number
- Use `Ctrl+C` to cancel

## Script Details

- **File:** `download-tv.ps1`
- **Size:** ~4.8 KB
- **PowerShell:** 5.1+ (Windows) or 7+ (cross-platform)
- **Dependencies:** bun, PowerShell
- **Features:** Terminal menu only, no GUI
