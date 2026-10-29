# Deployment

> Nothing in this repository deploys by itself, and no document here asks you to run anything against
> production until you decide to. DNS and domain changes are always manual.

## Why Cloudflare Workers (static assets) and not Pages

- Cloudflare's current guide for deploying Astro uses **Workers static assets** (`wrangler.jsonc`
  with `assets.directory`) and needs no Astro adapter for a static site. Its Pages-to-Workers
  migration guide presents Workers as the broader platform. Pages is **not** deprecated and would
  also work; Workers is the path Cloudflare documents for new Astro sites today (checked 2026-10-09 —
  re-check if you reconsider).
- Static asset requests are free and unlimited on Workers, so nothing is lost versus Pages.
- It uses the same config format (`wrangler.jsonc`), CLI and `_headers` file as the rest of the
  platform, and leaves room to add a Worker later if ever needed.

## What the config does (`wrangler.jsonc`)

| Key                         | Value                   | Effect                                                                                                                |
| --------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `name`                      | `giovannimariarava-com` | Worker name created on first deploy.                                                                                  |
| `compatibility_date`        | `2026-10-09`            | Pins runtime behaviour; bump deliberately.                                                                            |
| `assets.directory`          | `./dist`                | The Astro build output.                                                                                               |
| `assets.html_handling`      | `auto-trailing-slash`   | `/about` serves `about.html`; `/about/` and `/about.html` redirect to `/about`. Verified locally with `wrangler dev`. |
| `assets.not_found_handling` | `404-page`              | Unknown paths return `404.html` with a real 404 status.                                                               |
| `routes` (commented)        | custom domains          | Enable to attach the domain — see below.                                                                              |

The test environment has its own file, `wrangler.staging.jsonc` (see [`environments.md`](environments.md)).

There is no `main`: no Worker code, therefore `_headers` applies to every response.

## CI/CD (`.github/workflows/`)

There are two environments (production and test). This section describes the production
pipeline; the test environment, the shared `pipeline.yml` and the launch/full switch are in
[`environments.md`](environments.md).

```
push / pull_request on main ──► verify ──(push to main AND DEPLOY_ENABLED=='true')──► deploy
```

`ci-cd.yml` calls the reusable `pipeline.yml`, which holds the steps below.

- `verify`: `npm ci` → Prettier check → `astro check` → `security.txt` check → build → internal links
  (external links are checked informationally). No secrets available.
- `deploy`: runs in the `production` GitHub Environment; rebuilds from the same commit and runs
  `npx wrangler deploy` (the pinned devDependency, no third-party deploy action).
- To block a bad change from shipping: protect `main` and require the `Verify` check.

## One-time setup (owner, manual)

1. **GitHub repo:** create it, push the code, enable branch protection on `main`
   (PR required, `Verify` check required).
2. **Cloudflare API token:** dashboard → _My Profile → API Tokens → Create Token_, template
   **"Edit Cloudflare Workers"**; restrict to your account, set an expiry. Also note your **Account ID**.
3. **GitHub Environment:** _Settings → Environments → New environment_ named `production`
   (optionally add yourself as a required reviewer for a manual approval gate before each deploy).
   Add the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` **to the Environment**.
4. **Enable deploys:** _Settings → Secrets and variables → Actions → Variables_ → add
   `DEPLOY_ENABLED` = `true`.
5. **First deploy:** push/merge to `main`. The Worker is created and reachable on its
   `*.workers.dev` URL — check it there first (run the verification list in `docs/security.md`).
6. **Attach the domain (DNS-affecting):** in `wrangler.jsonc` uncomment `routes`, keeping
   `giovannimariarava.com` (and `www` if wanted). On the next deploy Cloudflare creates the DNS records and
   certificate. Remove any conflicting existing `A/AAAA/CNAME` record for the same name first; `MX`
   records for Email Routing are unaffected. Decide how `www` behaves (redirect to the apex via a
   Cloudflare Redirect Rule is the usual choice).
7. **After it is live:** run the verification list, then follow the HSTS rollout in `docs/security.md`.

## Manual deploy (without CI)

```bash
npm ci && npm run verify
CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… npx wrangler deploy
```

## Rollback

Cloudflare keeps previous versions of the Worker: _Workers & Pages → giovannimariarava-com →
Deployments_ to roll back from the dashboard, or `npx wrangler rollback`. Alternatively revert the
commit on `main` and let CI redeploy.

## Preview locally with the real header behaviour

`npm run build && npx wrangler dev` serves `dist/` including `_headers` (default
`http://127.0.0.1:8787`); it deploys nothing.
