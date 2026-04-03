export interface Video {
  title: string;
  url: string;
  description?: string;
}

export interface PluginOptions {
  downloadDir?: string;
}

export interface ScrapeResult {
  videos: Video[];
  source: string;
}

export interface ExtractedVideoUrl {
  url: string;
  title: string;
}

export abstract class Plugin {
  abstract name: string;
  abstract supportedDomains: string[];

  abstract canHandle(url: string): boolean;
  abstract scrape(url: string): Promise<ScrapeResult>;
  abstract getVideoUrlExtractorScript(): string;
}
