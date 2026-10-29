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

1. In `.github/workflows/ci-cd.yml` change `site_mode: launch` to `site_mode: full`.
2. Merge to `main`. The next production deploy publishes everything.
3. Check the live site with the verification list in `docs/security.md`, then submit the sitemap
   (`sitemap-index.xml`) in Google Search Console.

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
5. **Attach the test domain (DNS-affecting):** `giovannimariarava.com` must be a zone in your
   Cloudflare account. In `wrangler.staging.jsonc` uncomment `routes`; the next push to `develop`
   makes Cloudflare create the DNS record and certificate for `test.giovannimariarava.com`.
6. **Branch protection** (_Settings → Branches_): protect `main` (PR required) and require the check
   named **`Production / Verify`**; optionally protect `develop` and require **`Staging / Verify`**.
   The names appear in the list only after each workflow has run once.
7. **Dependabot** now opens its PRs against `develop` (`target-branch` in `dependabot.yml`), so each
   update is tried on the test site first.

## Limits worth knowing

- The test site is public (anyone with the URL can open it); it is only hidden from search engines.
  Do not put confidential material on it. If you need real access control, put Cloudflare Access in
  front of `test.giovannimariarava.com` (free for small teams) — not done here.
- `X-Robots-Tag` and `robots.txt` are requests, not access control (see `public/robots.txt`).
- HSTS (see `docs/security.md`) is set per host. Roll it out on the test host first; do not use
  `includeSubDomains` on the apex until the test subdomain is verified on HTTPS.
- Branch protection is configured on GitHub by you; the repository cannot enforce it by itself.
