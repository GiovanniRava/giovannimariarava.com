# Go-live checklist

Target: site ready by **March 2027**, shared via QR code at RSA Conference (San Francisco).
Tick items as you complete them. `grep -rn TODO .` lists every remaining marker.

## Content (nothing was invented — all of this is for you to write)

- [ ] `src/pages/index.astro`: the 3-line introduction (and `jobTitle` in the `Person` JSON-LD).
- [ ] `src/pages/about.astro`: bio, background, research interests.
- [ ] `src/lib/site.ts`: `description`, `university`, `sameAs` (LinkedIn and GitHub URLs), contact `email`.
- [ ] `src/pages/cv.astro` + replace `public/cv.pdf` (currently a placeholder).
- [ ] Research, project and writing entries: replace or delete the three `example-*` files.
- [ ] `/privacy`: confirm the analytics choice (default: **no analytics script**).
- [ ] Replace `public/og-default.png` (solid-colour placeholder, 1200×630) and `public/favicon.svg`.
- [ ] README: choose a licence for code and content.

## Decisions

- [ ] `public/robots.txt`: decide on AI **training** crawlers (blocks prepared, commented out).
- [ ] `www` behaviour (redirect to apex recommended).
- [ ] Analytics: none (default) vs Cloudflare Web Analytics (needs CSP + `/privacy` changes).

## Cloudflare / email

- [x] Create `security@giovannimariarava.com` (and the public contact alias from `site.ts`) in Email Routing, and test both. (Done 2026-10-29.)
- [ ] Renew `Expires` in `public/.well-known/security.txt` (currently 2027-10-01; CI warns 30 days before).

## Infrastructure (see `docs/deployment.md`)

- [ ] GitHub repo, branch protection, Dependabot/secret scanning enabled.
- [ ] Cloudflare token, `production` Environment + secrets, `DEPLOY_ENABLED=true`.
- [ ] Test environment: `develop` branch, `staging` Environment + secrets, `STAGING_DEPLOY_ENABLED=true`, then `routes` in `wrangler.staging.jsonc` (`docs/environments.md`).
- [ ] Branch protection: `Production / Verify` on `main`, `Staging / Verify` on `develop`.
- [ ] **Release:** after the test site is checked, set `site_mode: full` in `.github/workflows/ci-cd.yml` and merge to `main`.
- [ ] First deploy, check on `*.workers.dev`, then uncomment `routes` and deploy again.

## Verification after deploy (see `docs/security.md`)

- [ ] securityheaders.com, CSP Evaluator, SSL Labs, Mozilla Observatory.
- [ ] Console clean on every page type (home, list, detail, 404).
- [ ] Lighthouse (performance, accessibility, SEO) on mobile.
- [ ] Rich results / schema validation of the JSON-LD; social-preview check (LinkedIn Post Inspector).
- [ ] RSS validates; `sitemap-index.xml`, `llms.txt`, `robots.txt`, `security.txt` load.
- [ ] HSTS gradual rollout (300 s → 1 day → 1 week → 1 month → 1 year).

## QR code for RSA

- [ ] Point the QR code at `https://giovannimariarava.com/` (short, no tracking parameters, no redirects).
- [ ] Use high error correction (level M or Q), a quiet zone of 4 modules, dark-on-light, large enough to scan from distance.
- [ ] Scan it with several phones, on mobile data (not only Wi-Fi), the week before and the day before.
- [ ] Make sure the first screen on a phone reads well: intro and featured research above the fold.
