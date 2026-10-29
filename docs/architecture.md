# Architecture

## Principles (in priority order)

1. **Simplicity and longevity** — few dependencies; content in portable Markdown with
   framework-neutral front matter, so a future framework change does not touch the content.
2. **Security as a calling card** — the site itself demonstrates good practice.
3. **Performance and accessibility** — static HTML, zero JavaScript where not needed.

## Folder structure

```
.
├── .github/
│   ├── workflows/ci-cd.yml      production: calls pipeline.yml for `main`
│   ├── workflows/staging.yml    test: calls pipeline.yml for `develop`
│   ├── workflows/pipeline.yml   reusable: verify + gated deploy (all the steps, once)
│   └── dependabot.yml           weekly grouped updates: npm + GitHub Actions
├── docs/                        this documentation
├── public/                      copied verbatim to dist/ (no processing)
│   ├── _headers                 Cloudflare response headers (CSP etc.)  → docs/security.md
│   ├── robots.txt               crawler policy                           → docs/seo-and-ai.md
│   ├── .well-known/security.txt RFC 9116 contact
│   ├── cv.pdf  favicon.svg  og-default.png     placeholders to replace
├── scripts/check-security-txt.mjs   zero-dependency security.txt validator
├── .vscode/extensions.json      recommended editor extensions (Astro, Prettier, EditorConfig)
├── src/
│   ├── content.config.ts        Zod schemas of the three collections     → docs/content-model.md
│   ├── content/{research,projects,writing}/*.mdx    the actual content
│   ├── components/              SEO, JsonLd, Header, Footer, EntryList
│   ├── layouts/                 Base (document shell), Entry (detail pages)
│   ├── lib/                     site.ts (identity constants), collections.ts (draft filter, dates)
│   ├── pages/                   routes (see below)
│   └── styles/global.css        the only stylesheet
├── integrations/deploy-target.mjs   launch-mode allow-list + staging noindex   → docs/environments.md
├── astro.config.ts  wrangler.jsonc  wrangler.staging.jsonc  tsconfig.json  .nvmrc  .editorconfig  .prettierrc.json  .prettierignore  .gitignore
```

## Routes

| Route                                | Source                      | Notes                                                                    |
| ------------------------------------ | --------------------------- | ------------------------------------------------------------------------ |
| `/`                                  | `pages/index.astro`         | 3-line intro (TODO), featured research, latest writing, `Person` JSON-LD |
| `/about`, `/cv`, `/privacy`          | `pages/*.astro`             | static pages                                                             |
| `/research`, `/projects`, `/writing` | `pages/<c>/index.astro`     | index lists (newest first)                                               |
| `/research/<slug>` …                 | `pages/<c>/[...slug].astro` | detail pages via `layouts/Entry.astro`                                   |
| `/writing/rss.xml`                   | `pages/writing/rss.xml.ts`  | RSS feed                                                                 |
| `/llms.txt`                          | `pages/llms.txt.ts`         | generated from the collections                                           |
| `/sitemap-index.xml`                 | `@astrojs/sitemap`          | automatic                                                                |
| 404                                  | `pages/404.astro`           | `noindex`; served with a real HTTP 404 by Cloudflare                     |

Every page reads content through `getPublished()` (`src/lib/collections.ts`), which excludes
`draft: true` entries in production. **Never call `getCollection` directly**: a draft could leak
into pages, the sitemap, RSS or `llms.txt`.

## Dependencies (exact versions, all pinned in `package.json`)

| Package                                                  | Kind    | Why                                                                                                                  |
| -------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `astro`                                                  | runtime | Static site generator. Output is plain HTML/CSS.                                                                     |
| `@astrojs/mdx`                                           | runtime | MDX support for content files (official integration).                                                                |
| `@astrojs/sitemap`                                       | runtime | Automatic `sitemap-index.xml` (official).                                                                            |
| `@astrojs/rss`                                           | runtime | RSS feed helper (official).                                                                                          |
| `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` | runtime | Self-hosted fonts as plain CSS + woff2 (no JS).                                                                      |
| `@astrojs/check`, `typescript`                           | dev     | `astro check`: types and content schemas. TypeScript is on **6.x** because `@astrojs/check` does not yet accept 7.x. |
| `prettier`, `prettier-plugin-astro`                      | dev     | Formatting.                                                                                                          |
| `linkinator`                                             | dev     | Broken-link check on `dist/`.                                                                                        |
| `wrangler`                                               | dev     | Cloudflare CLI; pinned so deploys are reproducible.                                                                  |

No Tailwind, no UI library, no analytics, no client-side framework.

## Design decisions

| Decision                                           | Reason                                                                                                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `output: 'static'`, no adapter                     | Nothing to run on a server; smallest attack surface.                                                                                                                 |
| `trailingSlash: 'never'` + `build.format: 'file'`  | One canonical URL per page (`/about`, file `about.html`). Matches Cloudflare `html_handling: auto-trailing-slash`. `/about/` and `/about.html` redirect to `/about`. |
| `build.inlineStylesheets: 'never'`                 | CSS stays in an external file, so the CSP can use `style-src 'self'` without hashes.                                                                                 |
| `@fontsource` instead of Astro's Fonts API         | The Fonts API emits inline `<style>` `@font-face` blocks, which would require `unsafe-inline` or per-build CSP hashes. See `docs/security.md`.                       |
| Theme via `prefers-color-scheme` only              | No JS toggle; follows the OS setting; no flash of wrong theme.                                                                                                       |
| CSS: custom properties, grid, container queries    | Modern, framework-free, and durable. Entry lists respond to their _container_ width.                                                                                 |
| `publicPath()` in `lib/site.ts`                    | With `format: 'file'`, `Astro.url.pathname` ends in `.html` at build time but not in dev; canonical URLs and the active nav item must use the public path.           |
| Strictest TypeScript (`astro/tsconfigs/strictest`) | Includes `exactOptionalPropertyTypes`; optional props are typed `T \| undefined` where passed through.                                                               |
| Examples are published (not drafts)                | So the whole pipeline (detail pages, RSS, `llms.txt`, sitemap) is exercised. Delete them or set `draft: true` before go-live.                                        |

## Accessibility

Semantic landmarks (`header`, `nav`, `main`, `footer`), a skip link, a single `h1` per page with a
correct heading outline (`h2` for sections, `h3` for items nested in a section), explicit `<time>`
elements, visible focus styles, `lang="en"`, colour pairs checked for WCAG AA contrast,
`prefers-reduced-motion` respected, and reflow down to phone width.
