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
pnpm lighthouse --verbose             # list every failing audit
pnpm lighthouse --min 90              # lower the bar
```

---

## 3. Cutting over to pankajabalasooriya.me

Do these in order. Steps 1–2 are safe and reversible; the site keeps serving
from the old host until DNS propagates in step 3.

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

### 3.3 Point DNS at GitHub Pages

At your DNS provider, replace the records currently pointing at the old site.

Apex (`pankajabalasooriya.me`) — four `A` records and four `AAAA` records:

```
A     185.199.108.153
A     185.199.109.153
A     185.199.110.153
A     185.199.111.153
AAAA  2606:50c0:8000::153
AAAA  2606:50c0:8001::153
AAAA  2606:50c0:8002::153
AAAA  2606:50c0:8003::153
```

Optionally, `www` as a `CNAME` to `pankajabalasooriya.github.io.`

> These are GitHub's published Pages IPs, but they do change occasionally —
> confirm against GitHub's "Managing a custom domain for your GitHub Pages
> site" docs before you edit records.

Check propagation:

```bash
dig +short pankajabalasooriya.me
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
