## Context

I'm Pankaja Balasooriya — final-year Electronic & Telecommunication Engineering
undergrad at University of Moratuwa, research intern at the Exertion Games Lab
(Monash). Work spans robotics, embedded hardware, PCB design, ML/MARL, and HCI
research. 

I'm building a **new** personal site from scratch. An older Astro portfolio lives
at `~/Projects/my-portfolio-astro` — **do not read it, copy it, or migrate from
it.** Treat this as greenfield.

Domain: `pankajabalasooriya.me` (currently pointed at the old site).
Hosting: GitHub Pages.

## Goal of this session

Build **the template only** — design system, layout, routing, content schemas,
theming, and deploy pipeline — with one or two placeholder entries per content
type. No real content yet. I'll fill content in later sessions.

## Stack (fixed — don't propose alternatives)

- Astro 5, static output (`output: 'static'`)
- Tailwind CSS v4 (`@tailwindcss/vite`), no config-file-heavy setup
- Astro Content Layer: `src/content.config.ts` with typed collections
- MDX for blog and project write-ups
- `@astrojs/sitemap`, `@astrojs/rss`
- TypeScript strict
- pnpm
- Zero client-side JS except the theme toggle. No React/Vue/Svelte islands
  unless a specific component genuinely needs interactivity.

## Content model

**Collections (MDX/Markdown):**
- `blog` — title, description, pubDate, updatedDate?, tags[], draft, heroImage?
- `projects` — title, summary, role, period, tags[], stack[], repo?, demo?,
  featured (bool), order, cover?

**Data collections (YAML — these are CV data, not prose):**
- `experience` — org, role, location, start, end?, bullets[], logo?
- `education` — institution, credential, start, end?, details[]
- `research` — title, authors[], venue, year, type (paper|demo|poster|preprint),
  doi?, pdf?, code?, abstract?
- `awards` — title, issuer, date, description?
- `volunteering` — org, role, start, end?, description?

Put YAML under `src/data/` and load it with `glob()`/`file()` loaders so
everything is Zod-validated and type-safe.

## Routes

```
/                 hero + tagline, featured projects, selected research, latest posts
/about            long-form bio, then education / experience / volunteering / awards
/research         publication list grouped by year, with links
/projects         filterable grid by tag
/projects/[slug]  case study page
/blog             post list
/blog/[slug]      post page with TOC, reading time, prev/next
/blog/tags/[tag]  tag archive
/cv               print-friendly rendering of the same YAML data (@media print)
/rss.xml, /sitemap-index.xml, /404
```

## Design direction

Clean, quiet, editorial. Not a dashboard, not a template-marketplace look.

- Light and dark themes, both first-class. Class strategy on `<html>`,
  `localStorage` + `prefers-color-scheme`, and an **inline blocking script in
  `<head>` so there is no flash of wrong theme**. This is a hard requirement.
- Define the palette as CSS custom properties in one `global.css` and reference
  them through Tailwind — I want to retheme by editing one block.
- Two typefaces max, self-hosted via Fontsource (no external font requests).
  Something with real character for headings; a clean sans or system stack for body.
- Generous whitespace, one accent colour used sparingly, max content width
  ~68ch for prose.
- Mobile-first. Test at 375px.
- Accessibility: semantic landmarks, visible focus rings, real contrast ratios,
  keyboard-navigable theme toggle, `prefers-reduced-motion` respected.

Tagline to use as placeholder on the hero:
> "I build intelligent systems end to end — from custom electronics and firmware
> to the software and learning algorithms that drive them."

## Deployment

- Deploy via GitHub Actions using `withastro/action` → Pages.
- **Do not touch DNS or add a CNAME file yet.** The domain still serves the old
  site and I'll cut over manually at the end.
- Until cutover, make the base path configurable:
  `base: process.env.PUBLIC_BASE ?? '/'` and `site` likewise, so the preview can
  run at `https://pankajabalasooriya.github.io/<repo>/` without breaking links.
  Every internal link and asset URL must go through `import.meta.env.BASE_URL`
  (or a `url()` helper) — no hardcoded leading-slash paths.
- Include a short `DEPLOY.md` documenting the exact cutover steps for later.

## How I want you to work

1. **Plan first.** Before writing any code, show me: file tree, the
   `content.config.ts` schemas, the CSS variable palette for both themes, and
   the font choice with a one-line rationale each. Wait for my approval.
2. Then build in this order, stopping after each for review:
   - a. Scaffold + config + Tailwind + theme system + base layout (header,
        footer, toggle, SEO/OG component)
   - b. Content schemas + placeholder data (2 blog posts, 2 projects, 2 of each
        YAML type — obviously fake, e.g. "Lorem Project")
   - c. All routes rendering that placeholder data
   - d. GitHub Actions workflow + DEPLOY.md
3. Small, focused commits with conventional-commit messages.
4. `pnpm build` must pass with zero warnings before you say a step is done.
5. If a decision is genuinely 50/50, ask me — don't silently pick.

## Non-goals for this session

- Real content or real copy
- Analytics, comments, newsletter, search
- CMS integration
- Animations beyond simple fades/view transitions
- Any dependency not listed above without asking first

## Definition of done

`pnpm dev` shows every route rendering placeholder content correctly in both
themes, with no flash on reload, Lighthouse ≥95 across the board on `/`, and a
green Actions run deploying to the Pages preview URL.
