# AGENTS.md

## Project overview

TV Series CLI is a Bun + TypeScript command-line app for scraping episode lists and downloading videos from supported Israeli TV sites.

Current supported sources:

- 13TV
- Mako / Keshet

Core flow:

1. Find a plugin for the provided URL.
2. Scrape episode links or accept a direct episode URL.
3. Optionally extract the streaming URL from the page.
4. Download with a bundled `yt-dlp` binary and FFmpeg support.

## How to work in this repo

Use Bun for everyday development. Prefer Bun commands over npm/yarn/pnpm.

Commit and push after each change so the remote stays in sync with the local work.

Research Bun behavior in the official docs first: <https://bun.com/docs.md>
Traverse the documentation website as needed to find the relevant page, examples, and CLI behavior before changing code.

Common commands:

- Install deps: `bun install`
- Run the CLI: `bun run src/index.ts "<URL>"`
- Run with prompt suppression: `bun run src/index.ts "<URL>" --no-prompt`
- Watch mode: `bun run --watch src/index.ts "<URL>"`
- Typecheck / lint: `bunx tsc -p tsconfig.json`

## Codebase layout

- `src/index.ts` — CLI entry point, argument parsing, plugin registration
- `src/lib/pluginManager.ts` — plugin lookup and scraping dispatch
- `src/lib/downloader.ts` — download orchestration
- `src/lib/videoUrlExtractor.ts` — Puppeteer-based page extraction
- `src/lib/ytdlpDownloader.ts` — downloads and caches the `yt-dlp` binary
- `src/lib/menu.ts` — interactive video picker
- `src/plugins/` — site-specific scraping and extraction logic
- `src/types/index.ts` — shared interfaces and abstract plugin base class

## Conventions

- The project is ESM-first (`"type": "module"`) and uses `.js` extensions in TypeScript imports.
- Keep plugin-specific logic inside `src/plugins/`.
- Prefer small, site-specific helpers over cross-cutting abstractions unless multiple plugins need them.
- Preserve the existing CLI style: emoji status messages, short logs, and user-facing errors.
- Keep Hebrew / RTL handling intact when editing titles and menu output.

## Important implementation notes

- `yt-dlp` is downloaded automatically into `downloads/.yt-dlp-bin` if it is not already present.
- The download directory is created automatically if missing.
- Mako/Keshet has strong bot detection; landing-page scraping and headless browser extraction can fail there.
- 13TV scraping currently relies on HTML and embedded script data first, then falls back to episode links.
- Title sanitization is intentionally conservative to keep filenames valid.

## Useful debugging tips

- If scraping returns no videos, inspect the plugin selector logic first.
- If extraction fails, check whether the site blocks headless browsers or changed its network requests.
- If downloads fail, verify `yt-dlp` and FFmpeg availability in PATH, or inspect the auto-downloaded binary under `downloads/.yt-dlp-bin`.
- If Bun execution behaves unexpectedly, verify the entry point with `bun run src/index.ts` instead of `node`.

## Research guidance for Bun

When researching Bun-related changes:

- Prefer Bun's official docs for runtime, package management, and `bunx`.
- Verify whether a feature is Bun-specific or standard TypeScript/Node behavior before changing code.
- If a command is meant to run in CI or on a contributor machine, check whether Bun is already assumed by the repo before introducing another toolchain.
- For new scripts, keep them runnable via `bun run <script>`.

## Change safety

Before editing:

- Check whether a change belongs in the CLI entry point, a shared lib, or a plugin.
- Avoid broad refactors when a plugin-local fix is enough.
- Preserve public interfaces in `src/types/index.ts` unless all usages are updated.
