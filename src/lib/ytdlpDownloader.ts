import { mkdir } from "fs/promises";
import { existsSync, chmodSync } from "fs";
import { join } from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

type Platform = "win32" | "darwin" | "linux";

export class YtdlpDownloader {
  private cacheDir: string;
  private platform: Platform;
  private arch: string;

  constructor(cacheDir: string = "./downloads/.yt-dlp-bin") {
    this.cacheDir = cacheDir;
    this.platform = (process.platform as Platform) || "linux";
    this.arch = process.arch;
  }

  async getExecutablePath(): Promise<string> {
    const executablePath = this.getExecutableFileName();
    const fullPath = join(this.cacheDir, executablePath);

    if (existsSync(fullPath)) {
      return fullPath;
    }

    console.log("yt-dlp not found locally. Downloading latest release...");
    await this.downloadLatestRelease(fullPath);
    return fullPath;
  }

  private getExecutableFileName(): string {
    if (this.platform === "win32") {
      return "yt-dlp.exe";
    }
    return "yt-dlp";
  }

  private getAssetName(): string {
    if (this.platform === "win32") {
      return "yt-dlp.exe";
    } else if (this.platform === "darwin") {
      if (this.arch === "arm64") {
        return "yt-dlp_macos_legacy";
      }
      return "yt-dlp_macos";
    } else {
      // linux
      if (this.arch === "arm64" || this.arch === "aarch64") {
        return "yt-dlp_linux_aarch64";
      }
      return "yt-dlp_linux";
    }
  }

  private async downloadLatestRelease(outputPath: string): Promise<void> {
    try {
      // Ensure cache directory exists
      await mkdir(this.cacheDir, { recursive: true });

      // Get latest release info from GitHub API
      const latestRelease = await this.getLatestRelease();
      const assetName = this.getAssetName();
      const asset = latestRelease.assets.find((a: any) => a.name === assetName);

      if (!asset) {
        throw new Error(
          `Could not find yt-dlp asset for ${this.platform}-${this.arch}`
        );
      }

      console.log(
        `Downloading yt-dlp ${latestRelease.tag_name} (${assetName})...`
      );

      // Download the binary
      const response = await fetch(asset.browser_download_url);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      // Stream to file
      const fileStream = createWriteStream(outputPath);
      await pipeline(response.body as any, fileStream);

      // Make executable on Unix systems
      if (this.platform !== "win32") {
        chmodSync(outputPath, 0o755);
      }

      console.log("✓ yt-dlp downloaded successfully");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download yt-dlp: ${error.message}`);
      }
      throw error;
    }
  }

  private async getLatestRelease(): Promise<any> {
    const response = await fetch(
      "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest"
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }
}
