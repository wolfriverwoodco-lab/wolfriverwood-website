import { defineConfig } from 'astro/config';

// Static output; server logic lives in /functions (Cloudflare Pages Functions).
export default defineConfig({
  site: 'https://wolfriverwood.example',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});
