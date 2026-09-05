# Progress

Status of the site, the decisions behind it, and what is left to do.
Deployment procedure lives in [DEPLOY.md](DEPLOY.md).

**Live:** <https://pankajabalasooriya.me> — custom domain, HTTPS enforced,
dual-stack IPv4 + IPv6. Every push to `main` builds, deploys, and audits.

---

## Where things stand

The **template is finished**. Every route renders, both themes work, the domain
cutover is done, and CI is green. What remains is almost entirely **content**:
the copy and data are still placeholders.

| Area | State |
| --- | --- |
| Design system, theming, layout | Done |
| Content schemas (8 collections) | Done |
| All routes | Done |
| Deploy pipeline + custom domain | Done |
| Quality gates (types, contrast, Lighthouse) | Done |
| **Real copy** | **Not started** |
| **Real content entries** | **Not started** |
| **Institution logos** | **Awaiting files** |

Lighthouse on the live domain: **100 / 100 / 100 / 100 / 100** (median of 3,
mobile emulation).

---

## Stack

Astro 5 static · Tailwind v4 · TypeScript strict · MDX · pnpm · Node 22.

```
astro 5.18  @astrojs/mdx 4  @astrojs/sitemap 3  @astrojs/rss 4
tailwindcss 4  @tailwindcss/vite 4  sharp 0.35
dev: typescript 5.9  @astrojs/check  lighthouse 13  chrome-launcher
```

Astro is pinned to 5 deliberately — bare `astro` now resolves to 7.

**Zero client-side JavaScript except the theme toggle.** Page transitions use
the native CSS `@view-transition` rule rather than Astro's `ClientRouter`, and
the `/projects` tag filter is pure CSS (`:has()` plus radio inputs). Keep it
that way unless something genuinely needs interactivity.

---

## Commands

```bash
nvm use && pnpm install     # Node 22 is required; the default node here is v20
pnpm dev
pnpm build
pnpm check                  # types across .astro and .ts
pnpm contrast               # WCAG AA for every palette pair, both themes
pnpm lighthouse --runs 3    # audits the production build; --url to hit the live site
```

`pnpm contrast` reads the tokens straight out of `global.css`, so it re-checks
the real palette after a retheme rather than a copy that can drift.

---

## Routes

```
/                    hero, featured projects, selected research, latest posts
/about               bio, tools, work experience, education, contact
/research            publications grouped by year
/projects            filterable grid (CSS-only)
/projects/[slug]     case study
/blog                post list
/blog/[slug]         post with TOC, reading time, prev/next
/blog/tags/[tag]     tag archive
/cv                  print-friendly record + PDF download
/cv.pdf              the LaTeX CV — stable shareable link, do not rename
/rss.xml  /sitemap-index.xml  /404
```

---

## Content model

Eight collections in [src/content.config.ts](src/content.config.ts), all Zod-validated.

**Prose (MDX)** — `blog`, `projects` in `src/content/`.
**Data (YAML)** — `experience`, `education`, `stack`, `research`, `awards`,
`volunteering` in `src/data/`.

CV dates are month-precision **strings** (`"2025-01"`), not `Date`. A real
`Date` would invent a day and drag timezone drift onto the print CV; `YYYY-MM`
sorts correctly as a string anyway.

Drafts (`draft: true`) render in `pnpm dev` and are excluded from production
builds, so they never reach the live site.

---

## Decisions worth remembering

Things that look arbitrary later but were deliberate.

**`/about` and `/cv` have different jobs.** `/about` is the narrative with a
visual timeline; `/cv` is the complete record, print-ready, and the PDF. They
briefly duplicated each other and it made both worse.

**Tools stay on `/about`, not the homepage.** The homepage routes people to the
work; a tool inventory competes with that and reads junior to a research
audience. Considered and rejected — don't re-add it without a reason.

**No proficiency bars on the stack.** Unverifiable, they age badly, and the
domain grouping already communicates range.

**Timeline span bars are scaled per section**, not per page. One shared scale
would squash internships against a decade of schooling.

**Logos sit on a light chip** so a single normal-colour file works in both
themes. `logoDark` exists as a per-entry override. Missing logos fall back to a
monogram rather than a gap.

**`sameAs` carries only verified profiles.** A wrong `sameAs` asserts an
identity link that isn't true. GitHub, Scholar and ORCID were machine-checked;
LinkedIn blocks bots and is marked verified on the owner's word.

**Theme is three-state** — system / light / dark. With only two, choosing either
left no way back to following the device.

---

## Gotchas

Each of these cost real time. Read before debugging.

**Node 22 is required.** The default `node` on this machine is v20 and pnpm 11
needs ≥22.13. Run `nvm use` first — `.nvmrc` pins it.

**A collection that looks empty is probably a stale dev server.** Astro's
content layer does not pick up a newly created directory under `src/content/`
in a running server. Restart before suspecting the schema.

**Astro's dev server caches image transforms server-side.** Edit an image and
dev may keep serving the old one even after a hard refresh. Verify against
`pnpm build`.

**`sharp` must be a direct dependency.** pnpm's strict `node_modules` means
Astro's nested copy is not resolvable, and image generation fails with
`MissingSharp`.

**`<meta charset>` must stay first in `<head>`.** The blocking theme script is
large enough to push it past the 1024 bytes browsers sniff, which Lighthouse
catches as a Best Practices regression.

**`Astro.url.pathname` already includes the base path.** Passing it through
`absoluteUrl()` applies the base twice — invisible at `base: '/'`, broken under
the Pages preview. Use `absoluteFromPathname()`.

**Build scripts need allowlisting** in `pnpm-workspace.yaml` (`allowBuilds`),
or pnpm skips `sharp` and `esbuild`.

**Never hardcode a leading-slash path.** Every internal link and asset goes
through `url()` in [src/lib/url.ts](src/lib/url.ts).

---

## What's left

### Content — the real remaining work

1. **Hero copy.** `site.hero.headline` and `.sub` are still the placeholder
   tagline. "I build intelligent systems end to end" could describe thousands
   of engineers; specificity is the biggest single improvement available.
2. **A proof line and an intent line.** What you've shipped or published, and
   what you're looking for (e.g. PhD positions and when). The second is the
   highest-value sentence on the site for the people most likely to act on it.
3. **The `/about` biography** — three Lorem paragraphs currently carrying the
   whole page.
4. **Replace every placeholder entry** in `src/content/` and `src/data/`. They
   are marked `PLACEHOLDER`.
5. **`src/data/stack.yaml`** is guesswork seeded from the project files. The
   real list should include 4-layer PCB design, computer vision, 3D enclosure
   modelling, and the drone/IoT work.

### Assets

6. **Institution logos** → `public/logos/`, then reference by filename from the
   YAML. Use official artwork from each institution's brand or press page; see
   the README in that folder. This is the biggest visual improvement left on
   `/about`.
7. **`public/og-default.png`** is still the generated placeholder card, so link
   previews on LinkedIn, X and Slack show a stand-in rather than anything real.

### Optional

8. `site.location` is deliberately empty — set it and the About page picks it up.
9. `~9 MB` of source PNGs in the repo (`portrait.png`, `portrait-landscape.png`).
   Harmless, and it preserves quality for re-crops; JPEG would cut it to well
   under a megabyte.
10. The `/projects` filter state isn't in the URL, so a filtered view isn't
    shareable — the deliberate price of zero JavaScript.
11. Contact block profile links repeat the footer's, roughly 40px apart.
12. Lighthouse in CI is advisory only (`continue-on-error`), because scores
    against a live URL vary on shared runners.
