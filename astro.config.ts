import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import deployTarget from './integrations/deploy-target.mjs';

// Set by the deploy workflows (.github/workflows/); defaults give the full site.
// See docs/environments.md.
const mode = process.env.PUBLIC_SITE_MODE === 'launch' ? 'launch' : 'full';
const target = process.env.SITE_ENV === 'staging' ? 'staging' : 'production';

/**
 * Astro configuration. Every non-obvious choice is explained in docs/architecture.md.
 */
export default defineConfig({
  // Canonical origin. Used for canonical URLs, sitemap, RSS, Open Graph and llms.txt.
  // The test environment overrides it with SITE_URL (https://test.giovannimariarava.com).
  site: process.env.SITE_URL ?? 'https://giovannimariarava.com',

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

  integrations: [
    mdx(),
    // Launch mode publishes a single page, so the sitemap lists only the home.
    sitemap({ filter: (page) => mode !== 'launch' || new URL(page).pathname === '/' }),
    deployTarget({ mode, target }),
  ],
});
