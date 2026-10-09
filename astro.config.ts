import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/**
 * Astro configuration. Every non-obvious choice is explained in docs/architecture.md.
 */
export default defineConfig({
  // Canonical origin. Used for canonical URLs, sitemap, RSS, Open Graph and llms.txt.
  site: 'https://giovannimariarava.com',

  // Fully static output: no adapter, no server runtime, nothing to patch.
  output: 'static',

  // /about (not /about/): one canonical URL per page. Matches wrangler.jsonc `html_handling`.
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Never inline CSS into <style> tags: lets the CSP use `style-src 'self'`
    // without 'unsafe-inline' or per-build hashes. See docs/security.md.
    inlineStylesheets: 'never',
  },

  integrations: [mdx(), sitemap()],
});
