# Environments: production and test

Two public environments, two branches, two independent pipelines. Nothing here deploys by itself:
DNS changes and the first deploys are manual steps listed below.

|                    | **Production**                        | **Test (staging)**                          |
| ------------------ | ------------------------------------- | ------------------------------------------- |
| URL                | `https://giovannimariarava.com`       | `https://test.giovannimariarava.com`        |
| Git branch         | `main`                                | `develop`                                   |
| Workflow           | `.github/workflows/ci-cd.yml`         | `.github/workflows/staging.yml`             |
| Cloudflare Worker  | `giovannimariarava-com`               | `giovannimariarava-com-staging`             |
| Wrangler config    | `wrangler.jsonc`                      | `wrangler.staging.jsonc`                    |
| GitHub Environment | `production`                          | `staging`                                   |
| Deploy switch      | variable `DEPLOY_ENABLED`             | variable `STAGING_DEPLOY_ENABLED`           |
| Site content       | `launch` mode now → `full` at release | always `full`                               |
| Search engines     | indexed (sitemap, robots allow)       | **not indexed** (robots Disallow + noindex) |

## How it fits together

```
 develop ──push──► staging.yml ──► pipeline.yml ──► Worker giovannimariarava-com-staging ──► test.giovannimariarava.com
    │                                (verify + deploy)
    └──PR/merge──► main ──push──► ci-cd.yml ──► pipeline.yml ──► Worker giovannimariarava-com ──► giovannimariarava.com
```

- **`pipeline.yml`** is a _reusable_ workflow that holds every step (install, format check,
  `astro check`, `security.txt` check, build, link check, `wrangler deploy`). It is written once so
  the two environments cannot drift apart. It has no triggers of its own.
- **`ci-cd.yml`** and **`staging.yml`** are thin callers. They decide the trigger and pass the
  parameters: site mode, public URL, environment name, wrangler config, deploy yes/no.
- The two Workers, the two GitHub Environments and the two deploy switches are independent. A
  mistake in `staging.yml` or `wrangler.staging.jsonc` cannot reach the production Worker.

## The same code on both branches: build-time switches

The code is identical on `main` and `develop`; only these environment variables, set by the
workflows (and by the `npm run build:*` scripts locally), change the output.

| Variable           | Values                             | Effect                                                                                                         |
| ------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_MODE` | `launch` / `full` (default `full`) | `launch`: only the minimal home page and the 404 are published. `full`: the whole site.                        |
| `SITE_URL`         | origin (default production origin) | Canonical URLs, sitemap, Open Graph, JSON-LD, `llms.txt`, RSS. Test sets `https://test.giovannimariarava.com`. |
| `SITE_ENV`         | `production` / `staging`           | `staging`: `robots.txt` becomes `Disallow: /` and every response gets `X-Robots-Tag: noindex, nofollow`.       |

Where it is implemented:

- `src/lib/site.ts`: `LAUNCH` flag, `SITE.url` from the configured `site`, `NAV` empty in launch mode.
- `src/pages/index.astro`: the launch landing page (no `TODO` placeholders, no unconfirmed email or
  social URLs in the JSON-LD).
- `integrations/deploy-target.mjs`: after the build, in launch mode it deletes from `dist/`
  **everything not on an allow-list** (`LAUNCH_ALLOW`); for staging it rewrites `robots.txt` and
  adds the `noindex` header. The allow-list is deliberate: a page added later does not reach
  production until you list it or switch to `full`.
- `astro.config.ts`: reads the variables; in launch mode the sitemap lists only `/`.

Why a mode flag and not a different branch content? Two branches that differ in files conflict on
every merge. With identical code, `develop → main` merges are clean and the release is a one-line change.

### Try it locally

```bash
npm run build:launch    # what production serves today (inspect dist/)
npm run build:staging   # the test site: full content, noindex, test URL
npm run build           # full site, production URL (default)
npx wrangler dev        # serve dist/ with the real headers (deploys nothing)
```

## Daily workflow

1. Work on `develop` (or a feature branch merged into `develop` through a PR).
2. Push to `develop`: `staging.yml` verifies and deploys to **test.giovannimariarava.com**. Try it,
   look for bugs. If something is broken, fix it on `develop`; production is untouched.
3. When the test site is good, open a PR `develop → main`. `ci-cd.yml` verifies it with the
   _production_ settings. Merge it: `main` deploys to production.

Because the production mode is `launch`, merging does not change what visitors see until you do the
release below. This lets you merge freely while the site is unfinished.

## Releasing the full site

When the test site is what you want to publish (all `TODO`s from `docs/go-live-checklist.md` done):

1. Run `npm run build && npm run check:placeholders` locally. It must print `placeholder check OK`.
2. In `.github/workflows/ci-cd.yml` change `site_mode: launch` to `site_mode: full`.
3. Merge to `main`. The next production deploy publishes everything.
4. Check the live site with the verification list in `docs/security.md`, then submit the sitemap
   (`sitemap-index.xml`) in Google Search Console.

### The placeholder gate

`scripts/check-placeholders.mjs` scans the built site (`dist/`) and **fails** if it finds the markers
`TODO`, `FIXME` or `lorem ipsum` in HTML, XML, TXT, SVG, JSON, CSS or PDF text, or any page whose file
name contains `example-` (the scaffold's sample entries). It prints each file with a snippet.

- **When CI runs it:** only for the **full production** build (`site_env: production` and
  `site_mode: full` in `pipeline.yml`). So flipping `site_mode` to `full` while a placeholder is left
  makes `Production / Verify` fail, the pull request cannot be merged, and nothing reaches the live site.
- **Why not elsewhere:** the test site is expected to contain placeholders, and launch mode publishes a
  single page. Note that launch mode still ships two harmless `TODO` comments, in `robots.txt` (the AI
  training-crawler decision) and `favicon.svg`; they are public but carry no information.
- **What it cannot see:** placeholder _content_ that is not marked, such as the solid-colour
  `og-default.png`, an unreplaced `cv.pdf` that has no `TODO` text, or invented wording. Those stay on the
  go-live checklist.
- **Run it locally** on any build: `npm run check:placeholders` (default `dist/`) or
  `npm run check:placeholders path/to/dir`. Exit code `1` = placeholders found, `2` = directory missing.

To go back to the landing page, revert that line (or use Cloudflare's rollback, see `deployment.md`).

## One-time setup (owner, manual)

Production setup is in `docs/deployment.md`. For the test environment, in addition:

1. **Branch:** create `develop` from `main` and push it.
2. **GitHub Environment `staging`:** _Settings → Environments → New environment_. Add the secrets
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to it (the same token as production works if
   it has "Edit Cloudflare Workers"; a separate token limits the damage if one leaks). No required
   reviewers: the test site should deploy without waiting.
3. **Enable test deploys:** _Settings → Secrets and variables → Actions → Variables_ → add
   `STAGING_DEPLOY_ENABLED` = `true`.
4. **First deploy:** push to `develop`. The Worker `giovannimariarava-com-staging` is created and is
   reachable on its `*.workers.dev` URL. Check it there first.
5. **Test domain (DNS-affecting):** `wrangler.staging.jsonc` already contains `routes` for
   `test.giovannimariarava.com` and `workers_dev: false` (the test site is reachable only on its
   own domain, so no `workers.dev` subdomain needs to be registered). Requirements:
   `giovannimariarava.com` is a zone in your Cloudflare account (nameservers pointing to
   Cloudflare) and there is no existing DNS record named `test`. The first deploy makes Cloudflare
   create the DNS record and the certificate (a few minutes).
6. **Branch protection and Environment rules:** see "GitHub repository settings" below.
7. **Dependabot** now opens its PRs against `develop` (`target-branch` in `dependabot.yml`), so each
   update is tried on the test site first.

## GitHub repository settings (configured 2026-11-02)

These live on GitHub, not in the repository: if the repo is recreated or transferred they must be
redone. The repository is **public**, so rulesets are enforced.

| Setting                                     | Value                                                                                                                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default branch                              | `main`                                                                                                                                                                            |
| Ruleset `protect main` (_Rules → Rulesets_) | Active, bypass list empty. Restrict deletions, block force pushes, **require a pull request** (0 approvals), **require status check `Production / Verify`**. "Up to date" is off. |
| Ruleset `protect develop`                   | Active, bypass list empty. Restrict deletions and block force pushes **only** (direct pushes stay allowed).                                                                       |
| Environment `production`                    | Deployment branches: **`main` only**. **Required reviewer:** the owner (self-review allowed: there is one user). Administrator bypass: off.                                       |
| Environment `staging`                       | Deployment branches: **`develop` only**. No reviewers: the test site deploys by itself.                                                                                           |
| Actions → fork pull requests                | **Require approval for all external contributors**.                                                                                                                               |

Consequences to remember:

- **No direct push to `main`.** Reach it with a pull request from `develop` once `Production / Verify`
  is green. If the PR sits on "Expected — Waiting for status to be reported", the check name in the
  ruleset does not match the real one: copy the name shown on the PR into the ruleset.
- **Each production deploy waits for approval.** After merging to `main`, open _Actions_ → the run →
  **Review deployments** → tick `production` → **Approve and deploy**. Without it the site does not change.
- **Why the Environment branch rule matters:** the Cloudflare secrets are only released to jobs
  running from the allowed branch, so a modified workflow on another branch cannot read them.
- A required check on `develop` is deliberately **not** set: it would reject direct pushes.

## Production domain and `www`

`wrangler.jsonc` attaches only the apex (`giovannimariarava.com`) with `workers_dev: false`. To make
`www.giovannimariarava.com` land on the apex (one canonical URL, as `trailingSlash`/canonical tags
already assume), in the Cloudflare dashboard:

1. **DNS → Records:** add `www` as a `CNAME` pointing to `giovannimariarava.com`, **Proxied** (orange cloud).
2. **Rules → Redirect Rules → Create rule:** if hostname equals `www.giovannimariarava.com`, then
   dynamic or static redirect to `https://giovannimariarava.com${http.request.uri.path}`, status 301,
   preserve query string.

## Limits worth knowing

- The test site is public (anyone with the URL can open it); it is only hidden from search engines.
  Do not put confidential material on it. If you need real access control, put Cloudflare Access in
  front of `test.giovannimariarava.com` (free for small teams) — not done here.
- `X-Robots-Tag` and `robots.txt` are requests, not access control (see `public/robots.txt`).
- HSTS (see `docs/security.md`) is set per host. Roll it out on the test host first; do not use
  `includeSubDomains` on the apex until the test subdomain is verified on HTTPS.
- Branch protection is configured on GitHub by you; the repository cannot enforce it by itself.
