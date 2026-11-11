import { defineConfig } from 'astro/config';

// Static output; server logic lives in /functions (Cloudflare Pages Functions).
export default defineConfig({
  site: 'https://wolfriverwoodco.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
