# TV Series CLI

A TypeScript CLI tool for scraping and downloading videos from Israeli TV websites using `yt-dlp` and FFmpeg.

## Features

- 🎬 Interactive video selection menu
- 📺 Extensible plugin system for multiple websites
- 🎯 Currently supports: **Mako/Keshet** and **13TV.co.il**
- 💾 Automatic download management with configurable output directory
- 🔍 Smart script injection for video URL extraction (no heavy waiters)
- ⚡ Fast and efficient video streaming URL capture

## How It Works

The CLI uses a **smart extraction architecture**:

1. **Landing Page Scraping**: Plugin scrapes the landing page to extract episode links using HTTP + cheerio
2. **Script Injection**: When downloading an episode, the CLI injects a custom script into the page to intercept streaming URLs
3. **URL Extraction**: The script captures M3U8 HLS URLs from XMLHttpRequest/fetch calls
4. **yt-dlp Download**: The extracted URL is passed directly to yt-dlp with FFmpeg for conversion

This approach **minimizes browser interaction** and **skips unnecessary page load waiters**, making it fast and reliable.

## Prerequisites

- **Bun** (https://bun.sh) - TypeScript runtime and package manager
- **FFmpeg** - Required by `yt-dlp` for muxing/merging and HLS downloads
  ```bash
  # macOS
  brew install ffmpeg
  # Ubuntu/Debian
  sudo apt install ffmpeg
  # Windows
  choco install ffmpeg
  ```

## Installation

```bash
# Install dependencies
bun install
```

`yt-dlp` does not need to be installed manually. The CLI downloads the latest release on first run and caches it under the active download directory's `.yt-dlp-bin` folder (default: `./downloads/.yt-dlp-bin`).

## Usage

### Basic Usage

```bash
bun run src/index.ts "<URL>" [download-directory]
```

### Examples

#### Download from Mako/Keshet (direct episode URL):
```bash
# Direct episode URL (recommended for Mako due to bot detection)
bun run src/index.ts "https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2/VOD-9b82073eaa41d91026.htm"
```

#### Download from Mako/Keshet landing page (when available):
```bash
# Landing page scraping - may be blocked if too many requests detected
bun run src/index.ts "https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2"
```

#### Download from 13TV:
```bash
bun run src/index.ts "https://13tv.co.il/yummies/games-of-chef/season-08/episodes/"
```

#### Download to a custom directory:
```bash
bun run src/index.ts "https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2" ~/MyVideos
```

#### Show help:
```bash
bun run src/index.ts --help
```

## Project Structure

```
src/
├── index.ts                      # Main CLI entry point
├── types/
│   └── index.ts                  # TypeScript interfaces and types
├── lib/
│   ├── pluginManager.ts          # Plugin management system
│   ├── downloader.ts             # Video download wrapper
│   ├── videoUrlExtractor.ts      # Script injection for URL extraction
│   ├── ytdlpDownloader.ts        # yt-dlp integration
│   └── menu.ts                   # Interactive CLI menu
└── plugins/
    ├── makoKeshetPlugin.ts       # Mako/Keshet website plugin
    └── thirteenTvPlugin.ts       # 13TV website plugin
```

## Adding New Websites

To add support for a new website:

1. Create a new plugin file in `src/plugins/`
2. Extend the `Plugin` abstract class
3. Implement `canHandle()` to detect your website URL
4. Implement `scrape()` to extract episodes from the landing page
5. Implement `getVideoUrlExtractorScript()` to return an injection script
6. Register the plugin in `src/index.ts`

### Plugin Template

```typescript
import { Plugin, ScrapeResult } from "../types/index.js";

export class MyWebsitePlugin extends Plugin {
  name = "mysite";
  supportedDomains = ["www.mysite.com", "mysite.com"];

  canHandle(url: string): boolean {
    const urlObj = new URL(url);
    return this.supportedDomains.includes(urlObj.hostname);
  }

  async scrape(url: string): Promise<ScrapeResult> {
    // Scrape landing page for episode links
    return {
      videos: [/* ... */],
      source: "mysite.com",
    };
  }

  getVideoUrlExtractorScript(): string {
    // Return JavaScript that extracts the video URL
    return `
      (function() {
        const contentTypes = new Set()
          .add('application/x-mpegurl')
          .add('application/x-mpegURL');
        
        XMLHttpRequest.prototype.open = function() {
          this.addEventListener('readystatechange', function() {
            const contentType = this.getResponseHeader('content-type');
            if (contentType && contentTypes.has(contentType)) {
              window.__extractedVideoUrl = this.responseURL;
            }
          });
          // Call original open method
          XMLHttpRequest.prototype.open.apply(this, arguments);
        };
      })();
    `;
  }
}
```

Then register it in `src/index.ts`:

```typescript
pluginManager.register(new MyWebsitePlugin());
```

## Development

Run in watch mode during development:

```bash
bun run --watch src/index.ts "<URL>"
```

## Troubleshooting

### "No videos found on the page"
- The website structure may have changed
- Check if the plugin's selectors need updating
- Use browser DevTools to inspect the page HTML

### "Could not extract video URL"
- The video extraction script may need adjustment for the site
- Some sites may use different video delivery methods
- Check browser network tab to see what streaming URLs are being used

### "ffmpeg not found"
- Ensure `ffmpeg` is installed and available in your PATH
- Try: `which ffmpeg` on macOS/Linux or `where ffmpeg` on Windows
- Install as shown in Prerequisites above

### Bundled yt-dlp download fails
- The CLI downloads `yt-dlp` automatically on first run, so check network access if that step fails
- Verify access to the GitHub release API and the `yt-dlp` release assets
- If you already have a global `yt-dlp` install, you can use it for manual troubleshooting

### Download fails
- Some videos may be geo-blocked or require authentication
- Check if the video URL is directly downloadable with your `yt-dlp` install or the cached binary in the active download directory

## Important Notes

### Mako/Keshet Bot Detection
Mako can be sensitive to automated access, but the current Puppeteer-based extraction flow does work in this project. In practice this means:

1. **Landing page scraping** may still be unreliable if the site changes or blocks requests
2. **Browser-based extraction** usually works with the current Puppeteer flow

**⚠️ Current Limitation**
This approach can still break if Mako changes its page structure, request flow, or anti-bot behavior.

**Solution - Manual Workaround**
1. **Open the series page in your browser** if automation fails:
   - `https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2`
  - Solve any CAPTCHA if prompted

2. **Find the M3U8 URL using Browser DevTools**:
   - Open DevTools (F12)
   - Go to Network tab
   - Reload or play video
   - Look for requests to `mako-vod.akamaized.net` with `.m3u8` in the URL
   - Copy the full URL (including query parameters)

3. **Download directly with yt-dlp**:
  If you have a global `yt-dlp` install, use:
   ```bash
   yt-dlp "https://mako-vod.akamaized.net/i/VOD/...full.m3u8?..." -o "episode.mp4"
   ```
  Otherwise, run the cached binary from the active download directory's `.yt-dlp-bin` folder.

**Why This Happens**
- Mako may use anti-bot protections that vary over time
- The video streaming URL is loaded dynamically after the page/player initializes
- If extraction fails, the app falls back to direct download attempts

**Alternatives**
If you need a fallback, consider:
- Using a real Chrome browser with Puppeteer's `headless: false` option (opens visible window)
- Manually extracting a few URLs and using them directly
- Using other Israeli TV sources that are less restrictive (13TV, etc.)

## License

MIT
