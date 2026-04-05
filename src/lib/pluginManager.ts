import type { Plugin, ScrapeResult } from "../types/index.js";

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  findPlugin(url: string): Plugin | null {
    for (const plugin of this.plugins.values()) {
      if (plugin.canHandle(url)) {
        return plugin;
      }
    }
    return null;
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const plugin = this.findPlugin(url);
    if (!plugin) {
      throw new Error(
        `No plugin available to handle: ${url}\nSupported domains: ${Array.from(this.plugins.values())
          .flatMap((p) => p.supportedDomains)
          .join(", ")}`
      );
    }
    return plugin.scrape(url);
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
