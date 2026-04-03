import puppeteer, { Browser, Page } from "puppeteer";
import { ExtractedVideoUrl } from "../types/index.js";

export class VideoUrlExtractor {
  private browser: Browser | null = null;

  async extractVideoUrl(
    episodeUrl: string,
    injectionScript: string
  ): Promise<ExtractedVideoUrl> {
    console.log(`Extracting video URL from: ${episodeUrl}`);

    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
      }

      const page = await this.browser.newPage();

      try {
        // Set user agent to match browser
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"
        );

        // Inject the extraction script before navigation
        await page.evaluateOnNewDocument(injectionScript);

        // Navigate to the episode page with minimal waiting
        await page.goto(episodeUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

        // Get page title for filename
        const pageTitle = await page.title();

        // Wait for the injected script to extract the URL (max 45 seconds)
        const videoUrl = await this.waitForExtractedUrl(page, 45000);

        if (!videoUrl) {
          throw new Error("Could not extract video URL from page");
        }

        return {
          url: videoUrl,
          title: this.cleanTitle(pageTitle),
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to extract video URL: ${error.message}`);
      }
      throw error;
    }
  }

  private waitForExtractedUrl(page: Page, timeoutMs: number): Promise<string | null> {
    return new Promise((resolve) => {
      let timeout: NodeJS.Timeout;
      let resolved = false;

      const checkForUrl = async () => {
        try {
          const url = await page.evaluate(() => {
            // Check if the injected script stored the URL in window
            return (window as any).__extractedVideoUrl || null;
          });

          if (url && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(url);
          }
        } catch (e) {
          // Ignore evaluation errors
        }
      };

      // Poll for URL every 500ms
      const pollInterval = setInterval(() => {
        checkForUrl();
      }, 500);

      timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          clearInterval(pollInterval);
          resolve(null);
        }
      }, timeoutMs);
    });
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/[^\w\sא-ת0-9:()[\]]/g, "")
      .trim()
      .slice(0, 200);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
