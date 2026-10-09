# giovannimariarava.com

Personal website of Giovanni Maria Rava — a **fully static** [Astro](https://astro.build) site
(no backend, no database, no cookies, no third-party requests), deployed on **Cloudflare Workers
(static assets)** and built to demonstrate good security practice by example.

> **Status:** scaffold with placeholder content. Every `TODO` must be resolved before go-live —
> the full list is in [`docs/go-live-checklist.md`](docs/go-live-checklist.md).

## Documentation map

| Document                                                 | What it covers                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| This README                                              | Run locally, add content, deployment overview, security choices at a glance |
| [`docs/architecture.md`](docs/architecture.md)           | Folder structure, every dependency and why, design decisions                |
| [`docs/content-model.md`](docs/content-model.md)         | Front-matter schema for research / projects / writing, drafts, dates        |
| [`docs/security.md`](docs/security.md)                   | Each security header, the CSP, supply-chain controls, how to verify         |
| [`docs/seo-and-ai.md`](docs/seo-and-ai.md)               | SEO component, JSON-LD, sitemap, RSS, `robots.txt`, `llms.txt`              |
| [`docs/deployment.md`](docs/deployment.md)               | Why Workers, CI/CD, one-time Cloudflare/GitHub setup, rollback              |
| [`docs/go-live-checklist.md`](docs/go-live-checklist.md) | Everything left to do before sharing the QR code                            |

## Run locally

Requirements: Node **24 LTS** (exact version in [`.nvmrc`](.nvmrc), enforced by `engines` in
`package.json`) and npm.

```bash
nvm use                # picks the version from .nvmrc (or: fnm use / volta)
npm ci                 # installs EXACTLY what package-lock.json says
npm run dev            # http://localhost:4321 — hot reload, drafts are visible
```

> If your Node is a different major version, npm prints an `EBADENGINE` warning. It is only a
> warning (Astro itself needs Node >= 22.12), but use the pinned version to match CI.
> Astro collects anonymous telemetry by default; disable it with `npx astro telemetry disable`.

| Command                           | Purpose                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                     | Dev server (drafts included)                                    |
| `npm run build`                   | Production build into `dist/` (drafts excluded)                 |
| `npm run preview`                 | Serve `dist/` with Astro's preview server                       |
| `npm run check`                   | `astro check`: TypeScript + content-schema validation           |
| `npm run format` / `format:check` | Prettier write / verify                                         |
| `npm run check:security-txt`      | Validates `security.txt` (required fields, not about to expire) |
| `npm run links`                   | Broken **internal** links in `dist/` (run after `build`)        |
| `npm run links:external`          | Also checks external links (informational only)                 |
| `npm run verify`                  | Everything CI runs, in order. **Run this before opening a PR.** |

To test the real Cloudflare behaviour (including the headers from `public/_headers`) locally:

```bash
npm run build && npx wrangler dev   # serves dist/ at http://127.0.0.1:8787, deploys nothing
```

## Add content

All content lives in `src/content/<collection>/<slug>.mdx` (plain `.md` also works). The file name
becomes the URL: `src/content/writing/my-post.mdx` → `/writing/my-post`.

1. Create the file in `research/`, `projects/` or `writing/`.
2. Fill the front matter (title, description, date, tags, optional links — see
   [`docs/content-model.md`](docs/content-model.md)).
3. Write the body in Markdown (MDX allows components, but prefer plain Markdown: it stays portable).
4. Preview with `npm run dev`. Set `draft: true` to keep it out of production while writing.
5. Run `npm run verify`. `astro check` rejects invalid front matter with a precise error.

```mdx
---
title: 'Poisoning the reviewer: a first look'
description: 'One sentence, up to ~160 characters: shown in search results, lists, RSS and llms.txt.'
date: 2027-01-15
updated: 2027-02-01 # optional
tags: ['llm', 'security']
links: # all optional
  repo: https://github.com/<you>/<repo>
  pdf: /papers/paper.pdf # put the file in public/papers/
draft: false
---

Body in Markdown…
```

Images and PDFs go in `public/` (served as-is, e.g. `public/papers/paper.pdf` → `/papers/paper.pdf`).
The CV is `public/cv.pdf` (currently a placeholder).

## How deployment works (overview)

- **Hosting:** Cloudflare Workers with static assets — no Worker code, no Astro adapter. Config in
  [`wrangler.jsonc`](wrangler.jsonc); headers in [`public/_headers`](public/_headers).
- **CI/CD:** [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).
  Every push / PR runs `verify` (format, `astro check`, `security.txt`, build, internal links).
  A push to `main` additionally runs `deploy` — **only if** the repository variable
  `DEPLOY_ENABLED` is `true`, so nothing is published until you opt in.
- **Dependencies:** Dependabot opens weekly grouped PRs for npm and for GitHub Actions.
- One-time setup (Cloudflare token, GitHub Environment, custom domain) and rollback:
  [`docs/deployment.md`](docs/deployment.md). Nothing in this repository deploys by itself.

## Security choices (at a glance)

Full reasoning in [`docs/security.md`](docs/security.md).

- **No JavaScript shipped**, no cookies, no storage, no third-party requests (fonts self-hosted).
- **Strict CSP** with no `unsafe-inline`: `default-src 'none'; script-src 'none'; style-src 'self'; …`,
  made possible by external CSS and self-hosted fonts.
- `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, a deny-by-default
  `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `frame-ancestors 'none'`.
- **HSTS deliberately not enabled yet** (sticky and hard to undo) — the rollout plan is documented
  in `public/_headers` and `docs/security.md`.
- `/.well-known/security.txt` per RFC 9116, with a CI check that fails when it is about to expire.
- **Supply chain:** exact versions + committed lockfile, `npm ci` in CI, Dependabot, GitHub Actions
  pinned by commit SHA, read-only workflow token, deploy secrets only in a protected Environment.

## Licence

TODO(giovanni): choose a licence for the code (e.g. MIT) and for the written content (e.g. CC BY 4.0).
