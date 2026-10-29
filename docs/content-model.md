# Content model

Content lives in `src/content/{research,projects,writing}/` as `.md` / `.mdx` files. The schema is
defined once in [`src/content.config.ts`](../src/content.config.ts) with Zod; `npm run check` and
`npm run build` fail with a precise message if front matter is invalid. **Keep this page in sync
with that file.**

## Common fields (all three collections)

| Field         | Type                 | Required             | Notes                                                                                             |
| ------------- | -------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| `title`       | string               | yes                  | `<title>`, `og:title`, headings, feeds.                                                           |
| `description` | string (1–200 chars) | yes                  | One sentence (~160 ideal). Meta description, lists, RSS, `llms.txt`.                              |
| `date`        | date                 | yes                  | Publication date, ISO `YYYY-MM-DD`. Drives sorting (newest first) and `datePublished`.            |
| `updated`     | date                 | no                   | Shown as "Updated"; becomes `dateModified` in JSON-LD.                                            |
| `tags`        | string[]             | no (default `[]`)    | Lowercase keywords, e.g. `['llm', 'code-review']`.                                                |
| `links.repo`  | URL                  | no                   | Source repository.                                                                                |
| `links.pdf`   | string               | no                   | URL or site path (`/papers/x.pdf`, file in `public/papers/`).                                     |
| `links.demo`  | URL                  | no                   | Live demo.                                                                                        |
| `draft`       | boolean              | no (default `false`) | `true`: visible in `npm run dev`, **excluded from production** (pages, sitemap, RSS, `llms.txt`). |

An empty `links:` key (for instance with every child commented out) is accepted and treated as `{}`.

## Extra fields

`research` only: `venue` (string, e.g. thesis / conference) and `authors` (string[], defaults to the
site owner when omitted; used for `ScholarlyArticle.author`).

## URL and JSON-LD per collection

| Collection | URL                     | JSON-LD type       |
| ---------- | ----------------------- | ------------------ |
| `research` | `/research/<file-name>` | `ScholarlyArticle` |
| `projects` | `/projects/<file-name>` | `CreativeWork`     |
| `writing`  | `/writing/<file-name>`  | `BlogPosting`      |

The `<file-name>` is the file name without extension. **Renaming a file changes its URL**; avoid it
after publication (shared links, QR codes and search results would break).

## Portability

Front matter uses only plain YAML keys and the body is standard Markdown, so the content survives a
change of framework. The only Astro-specific parts are the schema file and the layouts.

## Drafts: how the guarantee works

All pages, the RSS feed, `llms.txt` and the home page call `getPublished()`
(`src/lib/collections.ts`), the single place that applies the draft filter. This was tested by
building with a `draft: true` file and confirming it appeared nowhere in `dist/`.

## Gotchas when writing content

- **Comments in `.mdx`:** HTML comments (`<!-- … -->`) are **invalid in MDX** and break the build
  (`Unexpected character '!' … mdx-jsx:unexpected-character`). Use `{/* note */}` instead. In plain
  `.md` files `<!-- … -->` is accepted, but it is emitted verbatim into the published HTML and is
  visible to anyone using "view source" — never leave private notes or TODOs there for a live page.
  In both cases, prefer keeping notes outside the content (e.g. in `docs/go-live-checklist.md`).
- **Language:** the site is English-only. Write titles, descriptions and body in English.
- **Run `npm run verify` after editing content:** it catches invalid front matter and MDX syntax
  before CI does.
