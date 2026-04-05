#!/usr/bin/env bun

import { PluginManager } from "./lib/pluginManager.js";
import { VideoDownloader } from "./lib/downloader.js";
import { InteractiveMenu } from "./lib/menu.js";
import { ThirteenTVPlugin } from "./plugins/thirteenTvPlugin.js";
import { MakoKeshetPlugin } from "./plugins/makoKeshetPlugin.js";
import fs from "fs";
import path from "path";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  // Parse options
  let url = "";
  let downloadDir = "./downloads";
  let noPrompt = false;

  // Simple argument parsing
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg) {
      continue;
    }

    if (arg === "--no-prompt" || arg === "-n") {
      noPrompt = true;
    } else if (!url) {
      url = arg;
    } else if (!downloadDir || downloadDir === "./downloads") {
      downloadDir = arg;
    }
  }

  // Ensure download directory exists
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // Initialize plugin manager
  const pluginManager = new PluginManager();
  pluginManager.register(new ThirteenTVPlugin());
  pluginManager.register(new MakoKeshetPlugin());

  try {
    console.log("🎬 TV Series CLI - Video Downloader\n");

    // Scrape videos
    console.log("📡 Scraping videos...\n");
    const scrapeResult = await pluginManager.scrape(url);

    if (scrapeResult.videos.length === 0) {
      console.error("❌ No videos found on the page");
      process.exit(1);
    }

    console.log(`✓ Found ${scrapeResult.videos.length} video(s)\n`);

    // Select videos
    let selectedVideos: typeof scrapeResult.videos;
    const menu = new InteractiveMenu();
    
    if (noPrompt) {
      // In no-prompt mode, download all videos
      selectedVideos = scrapeResult.videos;
      console.log(`📥 Downloading all ${selectedVideos.length} video(s) to: ${downloadDir}\n`);
    } else {
      // Show interactive menu
      selectedVideos = await menu.selectVideos(scrapeResult.videos);
      console.log(
        `\n📥 Downloading ${selectedVideos.length} video(s) to: ${downloadDir}\n`
      );
    }

    // Download selected videos
    const downloader = new VideoDownloader(downloadDir);
    const plugin = pluginManager.findPlugin(url);
    
    for (const video of selectedVideos) {
      const confirmed = noPrompt ? true : await menu.confirmDownload(video);
      if (confirmed) {
        try {
          await downloader.download(video.url, plugin || undefined);
        } catch (error) {
          const RLM = "\u200F";
          const formattedTitle = video.title
            .split("\n")
            .map(line => `${RLM}${line}`)
            .join("\n");
          console.error(
            `❌ Failed to download "${formattedTitle}":`,
            error instanceof Error ? error.message : error
          );
        }
      } else {
        const RLM = "\u200F";
        const formattedTitle = video.title
          .split("\n")
          .map(line => `${RLM}${line}`)
          .join("\n");
        console.log(`⏭️  Skipped: ${formattedTitle}`);
      }
    }

    console.log("\n✅ All done!");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
🎬 TV Series CLI - Video Downloader

Usage: bun run index.ts <url> [download-dir] [options]

Arguments:
  <url>           URL to scrape for videos (required)
  [download-dir]  Directory to save downloads (default: ./downloads)

Options:
  -h, --help      Show this help message
  -n, --no-prompt Download all videos without interactive prompts

Examples:
  bun run index.ts https://13tv.co.il/yummies/games-of-chef/season-08/episodes/
  bun run index.ts https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2
  bun run index.ts https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2 ~/Videos
  bun run index.ts https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2 ./downloads --no-prompt

Supported Sites:
  - 13tv.co.il (Israeli TV series)
  - mako.co.il (Mako/Keshet series)
`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

