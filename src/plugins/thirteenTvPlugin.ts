import { load } from "cheerio";
import { Plugin, ScrapeResult, Video } from "../types/index.js";

export class ThirteenTVPlugin extends Plugin {
  name = "13tv";
  supportedDomains = ["13tv.co.il"];

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.supportedDomains.includes(urlObj.hostname);
    } catch {
      return false;
    }
  }

  async scrape(url: string): Promise<ScrapeResult> {
    console.log(`Scraping 13TV from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    const videos: Video[] = [];
    const baseUrl = new URL(url).origin;

    // Look for embedded video data in script tags (as JSON)
    $("script").each((_, scriptEl) => {
      const scriptContent = $(scriptEl).html();
      if (scriptContent && scriptContent.includes('"video"')) {
        try {
          // Find JSON structures containing video data
          const jsonMatches = scriptContent.match(/\{[^{}]*"video"[^{}]*\}/g);
          if (jsonMatches) {
            jsonMatches.forEach((jsonStr) => {
              try {
                const data = JSON.parse(jsonStr);
                if (data.video && data.name && data.link) {
                  const episodeUrl = data.link.startsWith("http")
                    ? data.link
                    : baseUrl + data.link;

                  videos.push({
                    title: this.cleanTitle(data.name),
                    url: episodeUrl,
                    description: data.description || "",
                  });
                }
              } catch (e) {
                // Continue to next match
              }
            });
          }
        } catch (e) {
          // Continue to next script tag
        }
      }
    });

    // If no videos found via JSON, try extracting from episode links
    if (videos.length === 0) {
      $("a").each((_, linkEl) => {
        const link = $(linkEl);
        const href = link.attr("href");
        const text = link.text().trim();

        if (href && href.includes("/allshows/series/") && text) {
          const url = href.startsWith("http") ? href : baseUrl + href;
          videos.push({
            title: this.cleanTitle(text),
            url: url,
            description: "",
          });
        }
      });
    }

    // Filter out any videos with empty titles
    const validVideos = videos.filter(v => v.title && v.title.length > 0);

    return {
      videos: validVideos,
      source: "13tv.co.il",
    };
  }

  getVideoUrlExtractorScript(): string {
    // Intercept M3U8 URLs from 13TV
    return `
      (function() {
        const contentTypes = new Set()
          .add('application/x-mpegurl')
          .add('application/x-mpegURL')
          .add('application/vnd.apple.mpegurl');
        
        const originalOpen = XMLHttpRequest.prototype.open;
        
        XMLHttpRequest.prototype.open = function() {
          this.addEventListener('readystatechange', function() {
            const contentType = this.getResponseHeader('content-type');
            if (contentType && contentTypes.has(contentType)) {
              window.__extractedVideoUrl = this.responseURL;
              console.log('Extracted video URL:', this.responseURL);
            }
          });
          originalOpen.apply(this, arguments);
        };
      })();
    `;
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/[^\w\sא-ת0-9:\n]/g, "")
      .trim()
      .slice(0, 150);
  }
}
