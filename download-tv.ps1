#Requires -Version 5.1
<#
.SYNOPSIS
    TV Series CLI - Interactive terminal URL selector
.DESCRIPTION
    Terminal-based menu to select a TV series URL and launch the downloader
.EXAMPLE
    .\download-tv.ps1
.NOTES
    Execution policy: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#>

param(
    [switch]$NoPrompt,
    [string]$DownloadDir = "./downloads"
)

# Available TV series
$SeriesUrls = @(
    @{
        Name = "The Amazing Race - Mako"
        Url = "https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2"
    },
    @{
        Name = "Games of Chef - 13TV (Season 8)"
        Url = "https://13tv.co.il/yummies/games-of-chef/season-08/episodes/"
    },
    @{
        Name = "Games of Chef - 13TV (Season 7)"
        Url = "https://13tv.co.il/yummies/games-of-chef/season-07/episodes/"
    },
    @{
        Name = "Yummies - 13TV"
        Url = "https://13tv.co.il/yummies/"
    }
)

function Show-Menu {
    Write-Host ""
    Write-Host "🎬 TV Series CLI - URL Selector" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($NoPrompt) {
        Write-Host "Auto-selecting first series (non-interactive mode)..." -ForegroundColor Yellow
        Write-Host ""
        return $SeriesUrls[0]
    }
    
    Write-Host "Available series:" -ForegroundColor Green
    for ($i = 0; $i -lt $SeriesUrls.Count; $i++) {
        Write-Host "  [$($i + 1)] $($SeriesUrls[$i].Name)" -ForegroundColor Green
    }
    Write-Host ""
    
    do {
        $choice = Read-Host "Select series (1-$($SeriesUrls.Count)) or press Ctrl+C to cancel"
        
        if (-not $choice) {
            continue
        }
        
        $index = [int]$choice - 1
        
        if ($index -ge 0 -and $index -lt $SeriesUrls.Count) {
            return $SeriesUrls[$index]
        }
        
        Write-Host "❌ Invalid selection. Please enter a number between 1 and $($SeriesUrls.Count)" -ForegroundColor Red
    } while ($true)
}

function Confirm-Download {
    param([object]$Selected)
    
    Write-Host ""
    Write-Host "Selected: " -ForegroundColor Cyan -NoNewline
    Write-Host "$($Selected.Name)" -ForegroundColor Green
    Write-Host "URL: $($Selected.Url)" -ForegroundColor Gray
    Write-Host "Download to: $DownloadDir" -ForegroundColor Gray
    Write-Host ""
    
    if ($NoPrompt) {
        Write-Host "Starting download (non-interactive mode)..." -ForegroundColor Yellow
        return $true
    }
    
    $response = Read-Host "Proceed? (y/n)"
    return $response -eq 'y' -or $response -eq 'yes'
}

try {
    # Get selection
    $selected = Show-Menu
    
    # Confirm
    if (-not (Confirm-Download $selected)) {
        Write-Host "❌ Download cancelled." -ForegroundColor Red
        exit 0
    }
    
    # Build command
    Write-Host ""
    Write-Host "🚀 Starting download..." -ForegroundColor Cyan
    Write-Host ""
    
    $cmdArgs = @("run", "src/index.ts", $selected.Url, $DownloadDir)
    if ($NoPrompt) {
        $cmdArgs += "-n"
    }
    
    # Execute bun
    & bun @cmdArgs
    
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "✅ Done!" -ForegroundColor Green
    } else {
        Write-Host "❌ Download failed with exit code: $exitCode" -ForegroundColor Red
    }
    
    exit $exitCode
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
