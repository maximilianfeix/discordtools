import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://discordtools.de",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [preact(), sitemap()],
  server: { port: 4321 },
  devToolbar: { enabled: false },
});
