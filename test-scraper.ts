import { MakoKeshetPlugin } from "./src/plugins/makoKeshetPlugin.js";

const plugin = new MakoKeshetPlugin();
const result = await plugin.scrape(
  "https://www.mako.co.il/mako-vod-keshet/the_amazing_race-s2"
);

console.log(`Found ${result.videos.length} episodes:\n`);
result.videos.slice(0, 5).forEach((v, i) => {
  console.log(`${i + 1}. ${v.title.substring(0, 50)}`);
});
