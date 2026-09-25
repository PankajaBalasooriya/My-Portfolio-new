# Places — product and implementation record

**Status:** implemented with labelled sample content; real stories and media are still required before launch.
**Site context:** Astro 5, static output, GitHub Pages, Tailwind CSS v4, typed
content collections, light/dark themes, and route-scoped client-side JavaScript.

## Implementation snapshot

Implemented on 25 September 2026:

- `/places` index with a progressively enhanced Cobe globe, derived stats,
  purpose filters, year groups, and a separate Upcoming section.
- Static detail pages for Colombo, Kandy, Melbourne, and Singapore. Every entry
  is explicitly marked as sample content and excluded from indexing.
- A Zod-validated `places` MDX collection with visits, galleries, related links,
  optional externally hosted video, and a `placeholder` publishing guard.
- Responsive Astro image rendering for covers, galleries, and video posters.
- Click-to-load video that sends no video bytes until the visitor asks to play.
- Two-axis pointer rotation, drag momentum, wheel and pinch zoom, keyboard
  rotation/zoom, visible zoom and reset controls, and deliberate card-to-marker
  camera movement.
- Theme-aware rendering, synchronized filters and markers, offscreen/tab-hidden
  animation pausing, WebGL fallback copy, and reduced-motion behavior.
- Cobe adds about 8.4 KB gzip to the `/places` client bundle. `pnpm check`,
  `pnpm build`, and the existing contrast checks pass. The sample page measured
  99 Performance and 100 Accessibility/Best Practices in the local audit; its
  lower SEO result is expected while every sample entry is intentionally
  `noindex`.

Before launch, replace the four SVG fixtures and sample copy with verified dates,
original media, and finished stories. Re-run mobile and cross-browser manual
testing with the real assets, verify any public upcoming travel, and remove
`placeholder: true` only when an entry is ready to be indexed.

## 1. Product decision

Build **Places** as an editorial record of where life, projects, travel, research, competitions,
conferences, and selected travel have taken me. The map should make the page
memorable, but the stories, photographs, and links are the content.

The page should answer three questions quickly:

1. Where have I worked, presented, competed, or explored?
2. Why did each place matter?
3. What work, event, or story can the visitor open next?

It should not read like a visited-countries counter or a holiday album. Personal
travel belongs when the photography, drone work, or experience is worth sharing;
it does not need to be forced into a research narrative.

### Recommended scope for the first release

- A `/places` index with an interactive globe, small derived stats, purpose
  filters, and a chronological card list.
- One static detail page per place at `/places/[slug]`.
- A typed MDX content collection; one file is the source of truth for each place.
- Optimized photographs, a curated gallery, and links to related work.
- A quiet `Upcoming` treatment for public, confirmed events.
- A video model and component that are ready when clips exist, but no dependency
  on video for launch.
- Full non-WebGL, no-JavaScript, keyboard, touch, and reduced-motion fallbacks.

### Explicitly defer from the first release

- Animated journey arcs. They imply a route even when unpublished stops are
  missing, and they add constant motion.
- A year scrubber. With only a handful of entries, year-grouped cards are clearer
  and much more accessible.
- “Approximate kilometres travelled.” The number is not meaningful until routes,
  stopovers, and the calculation rule are explicitly authored.
- Autoplaying drone clips. Posters should load first; video loads only after a
  visitor asks to play it.
- A JavaScript lightbox. The gallery should work as a normal responsive grid at
  launch; an accessible dialog can be added if the gallery proves to need it.
- A homepage Places section. Add it only after the collection contains at least
  four strong, finished stories.

These are deferred, not ruled out. The data model below can grow into them.

## 2. Experience and information architecture

### `/places` index

The page should use the existing `BaseLayout`, header, footer, typefaces, semantic
colour tokens, and spacing rhythm.

Recommended order:

1. **Page introduction** — “Places” plus a short line explaining that this is a
   record of work, events, and selected journeys.
2. **Journey globe** — restrained, texture-free, and styled from the site's
   existing palette. It has markers, not a second design language.
3. **Three compact facts** — visited places, countries, and work/event visits.
   Upcoming entries are excluded.
4. **Purpose filters** — `All`, `Conference`, `Research`, `Competition`, and
   `Travel`. These filter the cards and markers together.
5. **Chronological place list** — grouped by year, with cover image, location,
   date, purpose, a one-sentence summary, and a detail-page link.
6. **Upcoming** — a small separate section at the end, shown only when there is
   a public future entry.

The globe is a visual index, not the only navigation:

- Focusing or selecting a place card may rotate the globe to its marker.
- If reliable DOM marker buttons can be layered over the globe, activating a
  marker focuses or scrolls to its card.
- If marker activation is not robust across keyboard, touch, and browsers, the
  globe remains a draggable visualization and the cards remain the controls.
- If WebGL or JavaScript is unavailable, visitors still get the complete list.

On mobile the content and ordering stay the same. The globe becomes smaller and
does not auto-rotate; it is not replaced by a different or incomplete version.

### `/places/[slug]` detail page

Each detail page should contain:

1. Back link to all places.
2. Place name, country/region, purpose, date range, and a short summary.
3. Optimized cover image.
4. Short MDX story: context, what happened or what I worked on, and why it
   mattered. Rough target: 200–600 words.
5. Curated gallery, normally 3–8 images rather than a camera roll.
6. Optional click-to-load video with a poster and written description.
7. Related paper, event, project, demo, or external link.
8. Previous/next place navigation in chronological order.

If a city has been visited several times, it still has one place page. Its
`visits` array holds the separate events and dates.

## 3. Visual direction

Places must look like part of the current site:

- Reuse Fraunces for headings and Inter for body text.
- Reuse `--c-bg`, `--c-surface`, `--c-border`, `--c-text`, `--c-muted`,
  `--c-faint`, and `--c-accent` in both themes.
- Keep the existing `max-w-3xl` content width. A globe around 520–640 px wide is
  large enough without turning the page into a dashboard.
- Use the accent colour for active markers and links. Do not introduce a rainbow
  palette for purpose types; badges and text labels carry that distinction.
- Use filled markers for visited places and outlined markers for upcoming places.
  Never communicate status by colour alone.
- Use existing bordered cards, rounded corners, thin dividers, and generous
  whitespace. Avoid glass effects, neon glows, satellite textures, and dense map
  controls.
- The globe follows the resolved site theme immediately and updates when the
  theme changes.
- No continuous auto-rotation in v1. Visitors may drag the globe, while card
  selection can rotate it deliberately.

## 4. Content model

Use an Astro content collection of MDX files rather than one large YAML file.
This matches the existing blog/project architecture, gives every place its own
story body, validates the metadata, and generates detail pages cleanly.

```text
src/
  content/
    places/
      melbourne.mdx
      great-ocean-road.mdx
      wilsons-promontory.mdx
  assets/
    places/
      melbourne/
        cover.jpg
        gallery-01.jpg
        video-poster.jpg
      great-ocean-road/
        ...
```

The file name is the URL slug. Do not repeat `slug` in frontmatter.

### Proposed schema

The exact Zod syntax belongs in implementation, but this is the contract to
implement:

```ts
type Purpose = 'conference' | 'research' | 'competition' | 'travel';
type VisitStatus = 'visited' | 'upcoming';
type LocationPrecision = 'exact' | 'city' | 'region';

type Visit = {
  id: string;                 // unique inside this place, e.g. "sportshci-2026"
  title: string;              // event or reason for the visit
  start: string;              // YYYY-MM-DD; date-only string, not Date
  end?: string;               // YYYY-MM-DD; must be >= start
  purpose: Purpose;           // one primary purpose for predictable filtering
  status: VisitStatus;        // explicit; does not silently change with build date
  tags?: string[];            // optional secondary ideas: HCI, robotics, hiking
};

type GalleryImage = {
  src: ImageMetadata;         // validated with Astro's image() helper
  alt: string;
  caption?: string;
  credit?: string;
};

type PlaceVideo = {
  src: string;                // absolute CDN URL
  poster: ImageMetadata;      // local optimized image
  title: string;
  description: string;        // also covers silent/aerial footage accessibly
  captions?: string;          // site-relative .vtt path when speech exists
};

type RelatedLink = {
  label: string;
  url: string;
  kind: 'event' | 'paper' | 'project' | 'demo' | 'other';
};

type Place = {
  title: string;
  summary: string;
  locality: string;           // city, park, or region shown to visitors
  region?: string;
  country: string;
  countryCode: string;        // ISO 3166-1 alpha-2, used for reliable stats
  coordinates: { lat: number; lng: number };
  locationPrecision: LocationPrecision;
  cover: ImageMetadata;
  coverAlt: string;
  visits: Visit[];            // at least one
  gallery?: GalleryImage[];
  video?: PlaceVideo;
  links?: RelatedLink[];
  featured?: boolean;
  draft?: boolean;
};
```

Example authoring shape:

```yaml
---
title: Saarbrücken
summary: Presenting a SportsHCI demo in Germany.
locality: Saarbrücken
region: Saarland
country: Germany
countryCode: DE
coordinates:
  lat: 49.24
  lng: 6.99
locationPrecision: city
cover: ../../assets/places/saarbrucken/cover.jpg
coverAlt: A descriptive sentence about the actual photograph.
visits:
  - id: sportshci-2026
    title: SportsHCI 2026 demo
    start: 2026-11-16
    end: 2026-11-18
    purpose: conference
    status: upcoming
links:
  - label: SportsHCI 2026
    url: https://example.org/
    kind: event
draft: false
---

The story goes here after the visit.
```

Event dates and links in examples are placeholders until checked against the
event's official source. Do not publish an empty or guessed link.

### Data rules

- Store dates as validated `YYYY-MM-DD` strings. These are calendar dates, not
  instants, so converting them to JavaScript `Date` objects risks timezone drift.
- Sort visits newest first for reading. Use the earliest visit date to place a
  new place in the overall chronology unless editorial ordering is later needed.
- A place with both past and future visits appears in the main list and may also
  expose its upcoming visit; do not duplicate the place card.
- `status` is authored explicitly. A future date alone does not make an entry
  safe or ready to publish.
- Coordinates describe the public marker, not necessarily where a photograph was
  taken. `city` and `region` precision should use a public centroid.
- Draft entries render locally and are excluded from production, following the
  existing blog convention.
- Gallery `alt` text is required. A genuinely decorative image may use an empty
  alt string, but its caption must not contain information available nowhere else.

## 5. Media storage and delivery

There are three different asset classes; they should not be treated alike.

| Asset | Source of truth | Delivery |
| --- | --- | --- |
| Prose and metadata | MDX in Git | Built into static HTML |
| Web-ready images and posters | `src/assets/places/<slug>/` in Git | Astro generates hashed, responsive AVIF/WebP/fallback files |
| Original photos, RAW files, and master video | Private backed-up media archive, outside this repo | Never served directly |
| Web video encodes | External object storage/CDN | Loaded only after play |
| Captions (`.vtt`) | `public/media/places/<slug>/` in Git | Copied as small static files |

### Images

- Export a web master from the original: sRGB, orientation applied, metadata and
  GPS removed, normally 2000–2560 px on the long edge.
- Target roughly 1 MB or less per committed web master. Keep full-resolution
  originals out of Git.
- Keep web masters as high-quality JPEG (or PNG only when transparency is
  required). Let Astro create AVIF/WebP and responsive sizes; do not hand-author
  several derivatives.
- Use `<Picture>`/`<Image>` with explicit `width`, `height`, `sizes`, and alt text.
- Suggested generated widths: 480, 800, 1200, and 1600 px, adjusted to the actual
  layout. Covers may load eagerly on their own detail page; gallery images are
  lazy-loaded.
- Generate or select a 1200×630 social image per finished place. Until then, use
  the site's default Open Graph image rather than a poorly cropped gallery image.

Astro recommends keeping local images under `src/` because those files can be
transformed and bundled; files in `public/` are copied without processing:
<https://docs.astro.build/en/guides/images/#where-to-store-images>

### Video

Do **not** commit drone masters or normal delivery videos to this repository.
Git history retains every revision, GitHub blocks normal Git objects over 100 MB,
Git LFS cannot be used with GitHub Pages, and a Pages site has a recommended
1 GB repository/site limit.

Recommended delivery when video is introduced:

- Use object storage behind a CDN and a stable media subdomain, for example
  `media.pankajabalasooriya.me`. Cloudflare R2 is one possible provider, but the
  schema deliberately stores ordinary HTTPS URLs so the site is not locked to it.
- Export a 1080p H.264 MP4 with web-optimized/fast-start metadata. A WebM source
  is optional after real browser and size measurements.
- Keep an individual highlight clip short, normally 10–30 seconds, and aim for
  approximately 3–8 MB. Longer footage should go to a streaming platform rather
  than being embedded as one large file.
- Render only the local poster initially. Create the `<video>` element or assign
  its source after the visitor presses Play. Use `controls`, `playsinline`, and
  `preload="none"`.
- Do not autoplay. If a future design uses silent loops, they must be muted,
  pausable, disabled for reduced motion/data, and justified by testing.
- Include captions for speech and a concise written description for silent drone
  footage. The page must still make sense without playing the clip.
- Configure the media host for HTTPS, correct MIME types, byte-range requests,
  caching, and CORS from the site domain.

Relevant GitHub limits:
<https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
and
<https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github>.

### Media naming

Use predictable lowercase names rather than camera names:

```text
src/assets/places/wilsons-promontory/cover.jpg
src/assets/places/wilsons-promontory/gallery-01.jpg
src/assets/places/wilsons-promontory/gallery-02.jpg
src/assets/places/wilsons-promontory/video-poster.jpg
public/media/places/wilsons-promontory/drone.en.vtt
https://media.example/places/wilsons-promontory/drone-highlight-1080.mp4
```

## 6. Globe implementation decision

Use **Cobe** for v1. The technical spike passed the criteria below. It is a small
WebGL globe designed for a minimal visual treatment and now
supports markers and arcs. It can be used from a route-specific vanilla module;
no React/Vue/Svelte island is needed.

Official project: <https://github.com/shuding/cobe>

Do not begin with `globe.gl`. It has excellent built-in point/arc click handlers
and many layers, but that Three.js feature set is much larger than this page
needs and pulls the product toward a data-visualization interface. Reconsider it
only if a validated requirement cannot be met by Cobe plus accessible DOM cards.

Official comparison reference: <https://github.com/vasturiano/globe.gl>

### Spike result

The implemented `/places` route verifies:

- Astro static build and base-path deployment work.
- The globe reads both light and dark CSS variables and changes theme live.
- Dragging works with mouse and touch in two axes. A gesture that begins on the
  globe controls the globe; the surrounding page remains the mobile scroll area.
- A DOM card can rotate/focus the matching marker.
- Optional DOM marker buttons are enabled where CSS Anchor Positioning is
  available; cards remain the accessible controls everywhere else. Chromium was
  verified locally, while Firefox and Safari remain part of the launch pass.
- WebGL failure produces a useful fallback rather than a blank rectangle.
- The render loop stops when the globe is offscreen or the tab is hidden.
- There is no automatic movement under `prefers-reduced-motion`.
- The page still works with JavaScript disabled.
- The production bundle and Lighthouse result remain inside the budgets below.

The spike passed, so Cobe remains the dependency. Do not add a larger globe
library unless a validated requirement cannot be met by this implementation.

## 7. Derived data and behavior

Keep calculations deterministic and documented:

- **Places:** number of production place entries containing at least one
  `visited` visit.
- **Countries:** unique `countryCode` values among visited places.
- **Work/event visits:** visited visits whose purpose is `conference`, `research`,
  or `competition` (in other words, everything except personal travel).
- Upcoming visits are never included in completed stats.
- Filters match a place when any of its visits has that purpose.
- A selected filter updates both the HTML cards and globe markers, but filtered
  content remains in the DOM so controls and announcements are reliable.
- Announce the visible result count in a polite `aria-live` region.
- URL-persisted filter state is optional for v1; add it only if shareable filtered
  views are useful.

Do not derive travel distance from place chronology. If distance is added later,
author explicit route segments and label the result as great-circle distance,
not actual distance flown or driven.

## 8. Accessibility and resilience

- Treat the cards as the permanent source of truth. The interactive canvas has a
  concise accessible label and keyboard controls, while every destination remains
  available as a normal link outside the globe.
- Every destination is a normal HTML link in the card list.
- Filters use radio inputs or real buttons with clear selected state, not
  clickable `<div>` elements.
- Do not rely on hover. Marker/card synchronization must also work on focus and
  activation.
- Do not rely on colour for purpose, visited/upcoming state, or selection.
- Maintain visible focus styles and AA contrast in both themes.
- Preserve touch scrolling around the globe and use comfortably sized controls.
  A touch that starts on the canvas rotates or pinches the globe; touches outside
  the canvas scroll the page normally.
- Respect `prefers-reduced-motion`; no pulsing upcoming pin, animated arcs, or
  automatic camera movement.
- Provide a textual fallback for WebGL errors and context loss.
- With JavaScript disabled, render the intro, stats, filters as an unfiltered
  list, cards, detail pages, galleries, and related links.
- Video controls must be keyboard accessible. Captions or written alternatives
  are required when video communicates content.

## 9. Privacy, safety, and rights checklist

Before publishing each place:

- Strip EXIF and GPS data from exported images and video.
- Use city/region centroids for homes, accommodation, private labs, sensitive
  natural locations, or anywhere exact coordinates create risk.
- Publish upcoming travel only when the event and attendance are already public.
  Do not publish flights, accommodation, live location, or extra travel dates.
- Check event names, dates, venue, paper status, and links against official
  sources immediately before publication.
- Confirm permission before featuring identifiable people, especially children or
  lab participants.
- Confirm ownership or record a credit/license for every non-original asset.
- Confirm that recorded drone footage was captured and can be published lawfully;
  avoid exposing protected wildlife, private property, or restricted locations.
- Avoid third-party map tiles and analytics on this page. The globe should not
  add tracking or runtime API calls.

## 10. SEO and sharing

- Use the existing title, description, canonical URL, Open Graph, sitemap, and
  base-path helpers.
- `/places` gets a concise `CollectionPage`/`ItemList` JSON-LD description only
  if it can be implemented without duplicating or inventing claims.
- Detail pages may use `Place` JSON-LD with coarse coordinates. A visit that is a
  public event may additionally use `Event`, but only from verified metadata.
- Use the place cover or a deliberate 1200×630 crop for sharing; never expose
  the remote video as the Open Graph image.
- Draft and private entries must be excluded from the sitemap and production
  queries.

## 11. Implemented file layout

```text
src/
  content.config.ts                     # add places schema
  content/places/*.mdx                  # one place story per file
  assets/places/<slug>/*                 # web images and video posters
  components/places/
    PlacesGlobe.astro                    # progressive WebGL enhancement
    PlaceCard.astro
    PlaceFilters.astro
    PlaceGallery.astro
    PlaceVideo.astro
    PlacesStats.astro
  lib/places.ts                          # typed queries, sorting, derived stats
  pages/places/index.astro
  pages/places/[...slug].astro
  lib/site.ts                            # add Places to navigation
public/media/places/<slug>/*.vtt         # captions only, when needed
```

Globe behavior lives in the route-specific Astro component's TypeScript. No
framework island was introduced. The existing `PageLayout` is shared by the
index and detail routes rather than adding a one-off place layout.

## 12. Delivery sequence and current state

### Phase 0 — content and media inventory

**State:** outstanding for production content. The current four entries are
fixtures only.

- Choose 4–6 launch places with a real reason to exist.
- For each, collect dates, public coordinates, purpose, 1–2 sentence summary,
  cover candidate, gallery candidates, related links, and privacy level.
- Decide which entries are publishable now and which stay draft.
- Export web masters and record credits. Keep video optional.

**Exit:** a reviewed content sheet exists and no place depends on guessed facts.

### Phase 1 — globe spike

**State:** complete. Cobe was retained; the route bundle is about 8.4 KB gzip.

- Test Cobe against the mandatory spike criteria in section 6.
- Measure the real production bundle and mobile performance.
- Confirm the accessible relationship between the globe and DOM cards.

**Exit:** choose Cobe or the static SVG fallback before building the page around
the visualization.

### Phase 2 — content foundation and static experience

**State:** complete for the schema, routes, helpers, sample entries, and
progressive fallback. Real editorial content remains outstanding.

- Add the schema, typed queries, real entries, routes, navigation item, stats,
  filters, chronological list, and detail layout.
- Make the complete experience work before adding WebGL.

**Exit:** all content is usable with JavaScript disabled.

### Phase 3 — globe enhancement

**State:** complete, including two-axis rotation, momentum, zoom, keyboard
controls, card focus, marker activation, filtering, and theme synchronization.

- Add markers, card/marker synchronization, filtering, theme sync, touch behavior,
  error fallback, and render-loop pausing.

**Exit:** the globe improves discovery without becoming required navigation.

### Phase 4 — galleries and optional video

**State:** components and fixture media are complete. Real photographs, social
crops, captions, and an external video delivery location remain outstanding.

- Add responsive gallery images and social crops.
- Add the click-to-load video component only when at least one finished clip and
  its external delivery location exist.

**Exit:** all media meet size, accessibility, privacy, and rights checks.

### Phase 5 — quality and rollout

**State:** automated checks and the initial local audit pass. Final mobile,
cross-browser, real-media, base-path, and production audits remain for launch.

- Run type, build, contrast, accessibility, performance, base-path, and manual
  browser tests.
- Test with real content at 375 px, tablet, and desktop widths.
- Publish, then add a homepage link/section later only if it strengthens the
  homepage hierarchy.

## 13. Quality budgets and definition of done

The first release is done when:

- `pnpm check`, `pnpm build`, and `pnpm contrast` pass with no new warnings.
- The root-domain and GitHub Pages subpath builds have correct links and assets.
- `/places` and every detail page work in light and dark themes.
- All content remains reachable with JavaScript disabled and WebGL unavailable.
- Keyboard-only navigation can filter and open every place without entering the
  canvas.
- Reduced-motion mode has no automatic movement.
- Lighthouse on `/places` remains at least 95 for Performance and 100 for
  Accessibility, Best Practices, and SEO under the project's normal audit setup.
- Initial page load contains no video bytes.
- The new initial JavaScript for `/places` is measured and targeted at no more
  than 25 KB gzip. If the spike exceeds that materially, revisit the visualization.
- The initial page transfer, excluding cached fonts and user-initiated video, is
  targeted below 1.5 MB on mobile.
- Gallery images have dimensions, appropriate `sizes`, alt text, and lazy loading.
- Stats have tests or fixture assertions for drafts, upcoming visits, repeated
  countries, and multiple visits to one place.
- There are no exact private coordinates, embedded EXIF/GPS records, unverified
  event claims, or uncredited third-party assets.

## 14. Implementation decisions

Recommended defaults are included so these do not block planning:

1. **Fixture set:** Colombo, Kandy, Melbourne, and Singapore exercise visited,
   upcoming, research, conference, and travel states. They are not production
   claims and remain visibly labelled and `noindex`.
2. **Taxonomy:** use `conference`, `research`, `competition`, and `travel` as the
   four primary purposes; use freeform tags for overlap.
3. **Navigation:** add `Places` after `Projects`; do not add it to the homepage in
   the first release.
4. **Map:** start with the Cobe spike, with an accessible DOM list as the permanent
   source of truth.
5. **Video:** launch without video if no external media host is ready. When clips
   are ready, choose object storage/CDN and use ordinary HTTPS URLs rather than
   Git LFS or GitHub Pages.

The architecture is now implemented. Production rollout depends on the content
and media inventory rather than further platform work.
