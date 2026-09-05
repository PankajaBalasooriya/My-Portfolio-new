# Deploying

The site is a static Astro build published to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to
`main`.

Nothing in the source hardcodes a domain. `astro.config.mjs` reads:

```js
site: process.env.PUBLIC_SITE ?? 'https://pankajabalasooriya.me'
base: process.env.PUBLIC_BASE ?? '/'
```

and every internal link and asset goes through `url()` in
[`src/lib/url.ts`](src/lib/url.ts), so the same commit builds correctly at the
domain root or under a subpath. **Cutover is a settings change, not a code
change.**

---

## 1. First-time setup (preview at the github.io URL)

1. Create the repository and push `main`.
2. **Settings → Pages → Build and deployment → Source: `GitHub Actions`.**
   Do *not* pick "Deploy from a branch".
3. Push, or run the workflow manually from the Actions tab.

With no repository variables set, the workflow derives the preview URL from the
repository itself:

| Repository                              | Builds with                                        |
| --------------------------------------- | -------------------------------------------------- |
| `PankajaBalasooriya/My-Portfolio-new`   | `site=https://pankajabalasooriya.github.io`, `base=/My-Portfolio-new/` |
| `<owner>/<owner>.github.io`             | `site=https://<owner>.github.io`, `base=/`          |

So the preview lands at:

```
https://pankajabalasooriya.github.io/My-Portfolio-new/
```

The DNS for `pankajabalasooriya.me` is untouched by any of this — the old site
keeps serving until you do step 3 below.

### What to check on the preview

- Every page loads and no link 404s (the base path is applied everywhere).
- Images render — they are hashed under `/<repo>/_astro/`.
- `/rss.xml` and `/sitemap-index.xml` resolve.
- Light and dark both work, with no flash on reload.

---

## 2. Local builds

```bash
nvm use && pnpm install && pnpm build
```

Node 22 is required (pinned in `.nvmrc`; pnpm 11 needs ≥22.13). To reproduce
exactly what CI builds for the preview:

```bash
PUBLIC_SITE=https://pankajabalasooriya.github.io PUBLIC_BASE=/My-Portfolio-new/ pnpm build
```

Serve the result with `pnpm preview`.

### Quality gates

```bash
pnpm check        # astro check — types across .astro/.ts
pnpm contrast     # WCAG AA contrast for every palette pair, both themes
pnpm lighthouse   # Lighthouse against the production build (needs Chrome)
```

`pnpm contrast` reads the tokens straight out of `src/styles/global.css`, so it
re-checks the real palette after you retheme rather than a copy that can drift.

`pnpm lighthouse` builds nothing itself — run `pnpm build` first. It boots
`astro preview`, audits with mobile emulation and throttling, and exits non-zero
if any category falls below 95.

```bash
pnpm lighthouse --path /blog          # a different route
pnpm lighthouse --url https://...     # a deployed URL instead of the preview
pnpm lighthouse --verbose             # list audits scoring below 100
pnpm lighthouse --runs 3              # median of 3 runs, for noisy networks
pnpm lighthouse --min 90              # lower the bar
```

### Lighthouse in CI

The workflow runs a third job, **Lighthouse (non-blocking)**, after a successful
deploy. It audits the URL that was just published — median of 3 runs — and
writes the scores to the run summary.

It is `continue-on-error: true` on purpose. The deployment has already happened
by the time it runs, and scores against a live URL vary with network conditions
on a shared runner, so a dip must never fail the workflow or gate a release.
Read it as a report, not a gate. To enforce a threshold, make it a pre-deploy
job against a local `astro preview` instead — stable, but it no longer measures
what visitors actually get.

---

## 3. Cutting over to pankajabalasooriya.me

Do these in order. Steps 3.1–3.2 are safe and reversible — the old site keeps
serving throughout. Step 3.3 starts a short window where the domain serves
nothing, ending when step 3.4 completes and the certificate is issued. Expect
roughly five to fifteen minutes, dominated by certificate issuance.

### 3.1 Add the CNAME file

Because deployment is via GitHub Actions (not a branch), the custom domain must
be part of the build output, or Pages can drop it on a later deploy:

```bash
echo 'pankajabalasooriya.me' > public/CNAME
```

Commit it. Anything in `public/` is copied to `dist/` verbatim.

### 3.2 Set the repository variables

**Settings → Secrets and variables → Actions → Variables → New variable:**

| Name          | Value                            |
| ------------- | -------------------------------- |
| `PUBLIC_SITE` | `https://pankajabalasooriya.me`  |
| `PUBLIC_BASE` | `/`                              |

> **Set both, or neither.** Setting only `PUBLIC_SITE` leaves `PUBLIC_BASE`
> derived from the repo name, which builds a site that thinks it lives at
> `https://pankajabalasooriya.me/My-Portfolio-new/`. Every internal link would
> then 404.

Re-run the workflow so the variables take effect. The build log prints the
resolved values:

```
Building with site=https://pankajabalasooriya.me base=/
```

### 3.3 Release the domain from the old repository

**No DNS changes are needed.** `pankajabalasooriya.me` already resolves to
GitHub Pages — the apex carries GitHub's four A records and `www` is a CNAME to
`pankajabalasooriya.github.io`. The domain is currently claimed by the
**`my-portfolio-astro`** repository, and GitHub allows only one repository to
hold a custom domain at a time.

So, in the OLD repo (`my-portfolio-astro`):
**Settings → Pages → Custom domain →** clear the field → Save.

Verify it is released (expect a 404 while the domain is unclaimed):

```bash
curl -sI https://pankajabalasooriya.me | head -1
```

Only after this will the new repository accept the domain; otherwise GitHub
rejects it with "already in use by another repository".

For reference, should DNS ever need rebuilding from scratch, the apex needs
these A records (and `www` as a CNAME to `pankajabalasooriya.github.io`):

```
185.199.108.153   185.199.109.153   185.199.110.153   185.199.111.153
```

#### IPv6 (dual-stack)

`www` already answers over IPv6 — it is a CNAME to `pankajabalasooriya.github.io`,
which carries AAAA records. The apex needs its own AAAA records, added in
Namecheap → Advanced DNS as four `AAAA Record` entries on host `@`:

```
2606:50c0:8000::153   2606:50c0:8001::153
2606:50c0:8002::153   2606:50c0:8003::153
```

Keep the A records — this is dual-stack, and removing them breaks IPv4 visitors.

These are published by GitHub as /128 host addresses. Re-verify before relying
on them; both sources are authoritative and take a second to check:

```bash
curl -s https://api.github.com/meta | python3 -c "import sys,json;print(json.load(sys.stdin)['pages'])"
dig +short pankajabalasooriya.github.io AAAA
```

Confirm the result once propagated:

```bash
dig +short pankajabalasooriya.me AAAA
curl -6 -sI https://pankajabalasooriya.me | head -1
```

### 3.4 Set the custom domain in Pages

**Settings → Pages → Custom domain →** enter `pankajabalasooriya.me` → Save.
Wait for the DNS check to pass, then tick **Enforce HTTPS** (the certificate can
take up to an hour to issue; the box stays greyed out until it is ready).

### 3.5 Verify

- `https://pankajabalasooriya.me/` serves the new site over HTTPS.
- Deep links work: `/about`, `/projects/lorem-project`, `/blog`, `/cv`.
- `curl -sI https://pankajabalasooriya.me | head -1` returns `HTTP/2 200`.
- View source: canonical, OG, and sitemap URLs all read
  `https://pankajabalasooriya.me/...` with no `/My-Portfolio-new/` left over.
- The old github.io project URL now redirects to the custom domain.

---

## 4. Rolling back

To return to the preview URL and hand the domain back to the old site:

1. **Settings → Pages → Custom domain →** clear it.
2. Delete `public/CNAME` and commit.
3. Delete the `PUBLIC_SITE` and `PUBLIC_BASE` repository variables.
4. Re-run the workflow.
5. Restore the previous DNS records at your provider.

DNS and the Pages custom-domain setting are independent, so reverting DNS alone
is enough to stop traffic reaching the new site immediately.

---

## Notes

- The workflow uses `concurrency: pages` **without** `cancel-in-progress`, so
  overlapping pushes queue rather than interrupting a live deployment.
- `pnpm` is pinned to `11.25.0` in both `package.json` and the workflow. Bump
  both together.
- `pnpm-workspace.yaml` allowlists build scripts for `esbuild` and `sharp`.
  Without it, pnpm skips them and the build fails on image generation.
- Drafts (`draft: true`) render in `pnpm dev` and are excluded from production
  builds — they never reach Pages.
