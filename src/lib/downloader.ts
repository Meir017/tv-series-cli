import { spawn } from "child_process";
import path from "path";
import { YtdlpDownloader } from "./ytdlpDownloader.js";
import { VideoUrlExtractor } from "./videoUrlExtractor.js";
import { Plugin } from "../types/index.js";

export class VideoDownloader {
  private downloadDir: string;
  private ytdlpDownloader: YtdlpDownloader;
  private urlExtractor: VideoUrlExtractor;

  constructor(downloadDir: string = "./downloads") {
    this.downloadDir = downloadDir;
    this.ytdlpDownloader = new YtdlpDownloader(
      path.join(downloadDir, ".yt-dlp-bin")
    );
    this.urlExtractor = new VideoUrlExtractor();
  }

  async download(
    videoUrl: string,
    plugin?: Plugin,
    filename?: string
  ): Promise<void> {
    console.log(`Downloading: ${videoUrl}`);

    let actualUrl = videoUrl;
    let pageTitle = filename;

    // If it's an episode page and we have a plugin, extract the streaming URL
    if (plugin && this.isEpisodePage(videoUrl)) {
      try {
        const extracted = await this.urlExtractor.extractVideoUrl(
          videoUrl,
          plugin.getVideoUrlExtractorScript()
        );
        actualUrl = extracted.url;
        pageTitle = pageTitle || extracted.title;
      } catch (error) {
        console.warn(`Could not extract video URL via plugin: ${error}`);
        console.log("Attempting to download directly...");
      }
    }

    const outputTemplate = pageTitle
      ? `${this.downloadDir}/${pageTitle}.mp4`
      : `${this.downloadDir}/%(title)s.mp4`;

    console.log(`Saving to: ${this.downloadDir}`);

    try {
      const executablePath = await this.ytdlpDownloader.getExecutablePath();

      const args = [
        actualUrl,
        `-o`,
        outputTemplate,
        `--user-agent`,
        `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36`,
        `-f`,
        `best`,
        `--fragment-retries`,
        `infinite`,
        `--progress`,
      ];

      await this.executeDownload(executablePath, args);
      console.log("✓ Download completed!");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Download failed: ${error.message}`);
      }
      throw error;
    } finally {
      await this.urlExtractor.close();
    }
  }

  private isEpisodePage(url: string): boolean {
    // Episode URLs contain VOD-xxxxx pattern (e.g., VOD-9b82073eaa41d91026.htm)
    return url.includes("VOD-") && url.endsWith(".htm");
  }

  private executeDownload(
    executablePath: string,
    args: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(executablePath, args, {
        stdio: ["inherit", "inherit", "inherit"],
      });

      process.on("error", (error) => {
        reject(error);
      });

      process.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp exited with code ${code}`));
        } else {
          resolve();
        }
      });
    });
  }
}
