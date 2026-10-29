# SEO and AI agents

## Per-page metadata

`components/SEO.astro`, rendered by `layouts/Base.astro`, emits: `<title>` (`Page — Giovanni Maria Rava`),
meta description, `rel=canonical`, Open Graph (`og:*`, plus `article:published_time` /
`article:modified_time` on detail pages) and a Twitter `summary_large_image` card.
Canonical URLs are `origin + public path` (no `.html`, no trailing slash) via `publicPath()`.
The 404 page is `noindex`. Default social image: `public/og-default.png` (**placeholder**, 1200×630).

## Structured data (JSON-LD, `components/JsonLd.astro`)

| Where            | Type               | Key properties                                                                                                |
| ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Home             | `Person`           | `name`, `url`, `email`, `affiliation` (university), `jobTitle`, `sameAs` (LinkedIn/GitHub — **placeholders**) |
| Research entries | `ScholarlyArticle` | `headline`, `description`, `datePublished`, `dateModified`, `keywords`, `author`                              |
| Writing entries  | `BlogPosting`      | same                                                                                                          |
| Project entries  | `CreativeWork`     | same                                                                                                          |

Validate with https://validator.schema.org after go-live. Output is escaped (`<` → `<`) so content
cannot close the script element.

## Feeds and indexes

| File                 | Source                     | Notes                                                                                                                                          |
| -------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/sitemap-index.xml` | `@astrojs/sitemap`         | Automatic; excludes drafts because pages for drafts are not built.                                                                             |
| `/writing/rss.xml`   | `pages/writing/rss.xml.ts` | Only the blog. Advertised via `<link rel="alternate">` in every page.                                                                          |
| `/llms.txt`          | `pages/llms.txt.ts`        | Markdown index per [llmstxt.org](https://llmstxt.org): research, projects, writing, other pages; generated at build time from the collections. |

## `robots.txt` and AI bots

The file is commented in place. Policy:

- **Search engines and user-triggered AI agents/assistants: allowed** (`User-agent: * / Allow: /`).
  That covers search crawlers and AI search/answer bots (e.g. OAI-SearchBot, Claude-SearchBot,
  PerplexityBot) and agents fetching a page on a user's behalf (e.g. ChatGPT-User, Claude-User).
- **AI model-training crawlers: decision pending (TODO).** Candidate blocks (GPTBot, ClaudeBot,
  Google-Extended, Applebot-Extended, CCBot, Bytespider, meta-externalagent) are prepared but commented out.
  Blocking `Google-Extended` / `Applebot-Extended` does not affect Google/Apple search.
- `robots.txt` is advisory, not access control. Cloudflare can also inject its own managed AI rules;
  check the live file after deploying. Bot names change over time — re-check them against each vendor's
  documentation when you take the decision.

## Content guidelines that help both search and agents

Explicit dates (`<time datetime>` everywhere), one `h1` per page, descriptive link text, a unique
description per page, and plain HTML that needs no JavaScript to read.
