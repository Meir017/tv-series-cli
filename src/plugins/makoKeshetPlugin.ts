import { load } from "cheerio";
import { Plugin, ScrapeResult, Video } from "../types/index.js";

export class MakoKeshetPlugin extends Plugin {
  name = "mako";
  supportedDomains = ["www.mako.co.il", "mako.co.il"];

  canHandle(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.supportedDomains.includes(urlObj.hostname);
    } catch {
      return false;
    }
  }

  async scrape(url: string): Promise<ScrapeResult> {
    // Check if this is a landing page (series page) or direct episode URL
    if (url.includes("VOD-") && url.endsWith(".htm")) {
      // Direct episode URL provided
      console.log(`Single episode URL detected: ${url}`);
      return {
        videos: [
          {
            title: this.extractTitleFromUrl(url),
            url: url,
            description: "",
          },
        ],
        source: "mako.co.il",
      };
    }

    // Landing page scraping
    console.log(`Scraping Mako from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Check if we got blocked
    if (html.includes("Please unblock my IP") || html.includes("Incident ID") || html.length < 1000) {
      throw new Error(
        "Mako website is blocking automated requests. Please:\n" +
        "1. Wait a while and try again\n" +
        "2. Use the website directly in your browser\n" +
        "3. Provide episode URLs directly (e.g., https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2/VOD-xxxxx.htm)"
      );
    }

    const $ = load(html);

    const videos: Video[] = [];
    const baseUrl = new URL(url).origin;

    // Extract series ID from URL
    const urlMatch = url.match(/mako-vod-keshet\/(.+?)(?:\/|$)/);
    const seriesId = urlMatch ? urlMatch[1] : null;

    // Look for episode cards
    $("a").each((_, linkEl) => {
      const link = $(linkEl);
      const href = link.attr("href");

      if (!href || !href.includes("mako-vod")) {
        return;
      }

      // Skip navigation links
      if (href === url || (href.includes("mako-vod-keshet") && !href.includes("VOD"))) {
        return;
      }

      // Only include VOD episode links
      if (!href.includes("VOD-")) {
        return;
      }

      if (seriesId && !href.includes(seriesId)) {
        return;
      }

      // Extract episode info from the link's text content
      const boldTexts: string[] = [];
      link.find("strong, b").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 0) {
          boldTexts.push(text);
        }
      });

      // Combine texts
      let title = boldTexts.join("\n").trim();

      // Fallback to alt text
      if (!title || title.length < 3) {
        const img = link.find("img[alt]").first();
        if (img.length) {
          title = img.attr("alt") || "";
        }
      }

      title = this.cleanTitle(title);

      if (title.length > 0) {
        const episodeUrl = href.startsWith("http") ? href : baseUrl + href;

        if (!videos.find((v) => v.url === episodeUrl)) {
          videos.push({
            title,
            url: episodeUrl,
            description: "",
          });
        }
      }
    });

    return {
      videos: videos.filter((v) => v.title.length > 0),
      source: "mako.co.il",
    };
  }

  private extractTitleFromUrl(url: string): string {
    // Extract VOD ID from URL for use as fallback title
    const match = url.match(/VOD-([a-f0-9]+)/);
    return match ? `Episode (${match[1].substring(0, 8)})` : "Episode";
  }

  getVideoUrlExtractorScript(): string {
    // Intercept M3U8 URLs and other streaming URLs from Mako
    return `
      (function() {
        const contentTypes = new Set()
          .add('application/x-mpegurl')
          .add('application/x-mpegURL')
          .add('application/vnd.apple.mpegurl');
        
        const seenUrls = new Set();
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalFetch = window.fetch;
        
        // Intercept XMLHttpRequest
        XMLHttpRequest.prototype.open = function() {
          this.addEventListener('readystatechange', function() {
            const contentType = this.getResponseHeader('content-type');
            if (contentType && contentTypes.has(contentType) && !seenUrls.has(this.responseURL)) {
              seenUrls.add(this.responseURL);
              window.__extractedVideoUrl = this.responseURL;
              console.log('Extracted video URL via XHR:', this.responseURL);
            }
          });
          originalOpen.apply(this, arguments);
        };
        
        // Also intercept fetch for modern streaming
        window.fetch = function(...args) {
          return originalFetch.apply(this, args).then(response => {
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentTypes.has(contentType) && !seenUrls.has(response.url)) {
                seenUrls.add(response.url);
                window.__extractedVideoUrl = response.url;
                console.log('Extracted video URL via fetch:', response.url);
              }
            }
            return response;
          });
        };
      })();
    `;
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/[^\w\sא-ת0-9:\n()[\]'"-\.]/g, "")
      .trim()
      .slice(0, 300);
  }
}
