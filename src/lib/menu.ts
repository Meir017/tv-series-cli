import inquirer from "inquirer";
import { Video } from "../types/index.js";

export class InteractiveMenu {
  async selectVideos(videos: Video[]): Promise<Video[]> {
    if (videos.length === 0) {
      throw new Error("No videos available to select");
    }

    if (videos.length === 1) {
      console.log(`Only one video found: ${this.formatRTL(videos[0].title)}`);
      return videos;
    }

    // For multi-line titles, display with clear formatting
    console.log("Available videos:\n");
    videos.forEach((video, index) => {
      const lines = video.title.split("\n");
      if (lines.length === 1) {
        // Single line - just display it
        console.log(`  ${index + 1}. ${lines[0]}`);
      } else if (lines.length === 2) {
        // Two lines - episode + description
        console.log(`  ${index + 1}. ${lines[0]} - ${lines[1]}`);
      } else {
        // Three or more lines - episode, date, description
        const episode = lines[0];
        const date = lines[1];
        const desc = lines.slice(2).join(" ");
        console.log(`  ${index + 1}. ${episode} (${date}) - ${desc}`);
      }
    });
    console.log();

    const choices = videos.map((video, index) => ({
      name: video.title.split("\n")[0], // Only first line, no RTL markers
      value: index,
      short: `${index + 1}`,
    }));

    const answer = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selections",
        message: "Select video(s) to download (use Space to select, Enter to confirm):",
        choices,
        pageSize: 10,
      },
    ]);

    if (answer.selections.length === 0) {
      throw new Error("No videos selected");
    }

    return answer.selections.map((index: number) => videos[index]);
  }

  async confirmDownload(video: Video): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Download: ${video.title}?`,
        default: true,
      },
    ]);
    return answer.confirm;
  }

  private formatRTL(text: string): string {
    // Use RIGHT-TO-LEFT MARK (\u200F) to indicate Hebrew text direction
    // This is the standard Unicode mark for RTL scripts
    const RLM = "\u200F"; // RIGHT-TO-LEFT MARK
    
    return text
      .split("\n")
      .map(line => `${RLM}${line}`)
      .join("\n");
  }
}
