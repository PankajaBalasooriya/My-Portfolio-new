/**
 * Regenerate the site icons and the link-preview card in public/ from the
 * brand masters.
 *
 *   pnpm icons                 # rewrite favicon.svg/.png, apple-touch-icon, og-default
 *   pnpm icons --check         # fail if any of them are stale
 *
 * The masters in src/assets/brand are flat RGB — the artwork is already
 * composited onto solid white (mark-on-light) or solid black (mark-on-dark),
 * with no alpha of its own. Keying the background out by colour would eat the
 * blue wedge, so this un-mattes instead: it solves each pixel back to the
 * colour and coverage it had before compositing, which keeps anti-aliased
 * edges clean and the accent at full saturation.
 *
 * scripts/fonts holds static instances of the same two variable fonts the site
 * serves, so the card is set in the site's own faces rather than whatever
 * librsvg finds. They exist because fontconfig cannot read woff2 and because
 * the variable defaults are the wrong cut (Fraunces defaults to opsz 9 at
 * weight 900). Regenerate them with fontTools if the webfonts ever change:
 *
 *   f = TTFont('src/assets/fonts/fraunces-latin-opsz.woff2'); f.flavor = None
 *   instancer.instantiateVariableFont(f, {'opsz': 144, 'wght': 600}, inplace=True)
 *
 * with Inter instanced at {'wght': 400}, both renamed to the bare family name.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const master = (name) => fileURLToPath(new URL(`src/assets/brand/${name}`, root));
const out = (name) => fileURLToPath(new URL(`public/${name}`, root));

// Point fontconfig at our two faces and nothing else, before sharp loads and
// librsvg initialises it. Listing only this directory also keeps the render
// deterministic: there is no system font to silently substitute.
const fontDir = fileURLToPath(new URL('fonts', import.meta.url));
const fontCache = join(tmpdir(), 'portfolio-og-fontcache');
const fontConf = join(tmpdir(), 'portfolio-og-fonts.conf');
await mkdir(fontCache, { recursive: true });
await writeFile(
  fontConf,
  `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>${fontDir}</dir><cachedir>${fontCache}</cachedir></fontconfig>
`,
);
process.env.FONTCONFIG_FILE = fontConf;

const { default: sharp } = await import('sharp');

const CHECK = process.argv.includes('--check');

/** Site background, so the opaque icons sit on the page's own dark ground. */
const GROUND = { r: 0x14, g: 0x14, b: 0x1a };
/** Alpha below this is treated as background when finding the mark's bounds. */
const EDGE = 8;

/**
 * Undo `C = aF + (1-a)B` for a known solid B, recovering F and a per pixel.
 *
 * Over white the mark is darker than its ground, so the least-bright channel
 * carries the coverage; over black it is brighter, so the brightest does.
 */
async function unmatte(file, ground) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = info.width * info.height;
  const rgba = Buffer.alloc(px * 4);

  for (let i = 0; i < px; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const a =
      ground === 'white'
        ? 1 - Math.min(r, g, b) / 255
        : Math.max(r, g, b) / 255;

    // Fully transparent pixels have no recoverable colour; divide by 1 to
    // avoid a NaN and let the zero alpha discard the result anyway.
    const k = a > 1e-3 ? a : 1;
    const base = ground === 'white' ? 255 : 0;
    const un = (c) => Math.max(0, Math.min(255, Math.round((c - (1 - k) * base) / k)));

    rgba[i * 4] = un(r);
    rgba[i * 4 + 1] = un(g);
    rgba[i * 4 + 2] = un(b);
    rgba[i * 4 + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
  }

  return { data: rgba, width: info.width, height: info.height };
}

/** Crop to the mark's own bounds and centre it on a square, padded slightly. */
async function trimSquare({ data, width, height }, padFraction = 0.04) {
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= EDGE) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (right < 0) throw new Error('master is blank after un-matting');

  const w = right - left + 1;
  const h = bottom - top + 1;
  const side = Math.round(Math.max(w, h) * (1 + 2 * padFraction));

  // Stays raw end to end: a headerless buffer has to be handed back to sharp
  // with its geometry, both on the way out and into the composite.
  const cropped = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: w, height: h })
    .raw()
    .toBuffer();

  return sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: cropped,
        raw: { width: w, height: h, channels: 4 },
        left: (side - w) >> 1,
        top: (side - h) >> 1,
      },
    ])
    .png();
}

/** A rounded-rect mask, so the opaque icons are not bare squares. */
function roundedMask(side) {
  const r = Math.round(side * 0.22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}">
    <rect width="${side}" height="${side}" rx="${r}" ry="${r}" fill="#fff"/>
  </svg>`;
  return Buffer.from(svg);
}

/** The mark on the site's ground, inset so the corners have room to breathe. */
async function badge(markPng, side) {
  const inset = Math.round(side * 0.105);
  const mark = await sharp(markPng)
    .resize(side - inset * 2, side - inset * 2)
    .toBuffer();

  return sharp({
    create: { width: side, height: side, channels: 4, background: { ...GROUND, alpha: 1 } },
  })
    .composite([
      { input: roundedMask(side), blend: 'dest-in' },
      { input: mark, left: inset, top: inset },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const files = {};

const onLight = await (await trimSquare(await unmatte(master('mark-on-light.png'), 'white'))).toBuffer();
const onDark = await (await trimSquare(await unmatte(master('mark-on-dark.png'), 'black'))).toBuffer();

// 128px is twice the largest size a favicon is ever drawn at, which is enough
// detail without doubling the inline payload.
const [darkMark, lightMark] = await Promise.all([
  sharp(onLight).resize(128, 128).png({ compressionLevel: 9 }).toBuffer(),
  sharp(onDark).resize(128, 128).png({ compressionLevel: 9 }).toBuffer(),
]);

files['favicon.svg'] = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32">
  <style>
    /* The mark sits on transparency so it borrows the browser chrome as its
       ground — at 16px a badge would shrink the glyph to mush. Only one of
       the two renders; the other is switched off by the colour scheme. */
    .on-dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .on-light { display: none; }
      .on-dark { display: inline; }
    }
  </style>
  <image class="on-light" x="0" y="0" width="32" height="32" xlink:href="data:image/png;base64,${darkMark.toString('base64')}"/>
  <image class="on-dark" x="0" y="0" width="32" height="32" xlink:href="data:image/png;base64,${lightMark.toString('base64')}"/>
</svg>
`);

// Both raster icons carry their own ground: they cannot switch with the theme,
// and Apple composites a transparent home-screen icon onto white.
files['favicon.png'] = await badge(onDark, 96);
files['apple-touch-icon.png'] = await badge(onDark, 180);

/**
 * The link-preview card. 1200x630 is what Open Graph consumers expect, but
 * most of them also render it small, so this stays to the mark, the name and
 * one line: anything more is unreadable in a feed. Dark ground because the
 * card has to commit to one theme and the site's own is dark.
 */
const siteTs = await readFile(fileURLToPath(new URL('src/lib/site.ts', root)), 'utf8');

/**
 * Pulled out of site.ts rather than restated here, so the card cannot drift
 * from the page. A plain node script can't import the TypeScript, hence the
 * read: each key is unique in the file, and a miss throws rather than
 * silently rendering a card with a hole in it.
 */
function fromSite(key) {
  const match = siteTs.match(new RegExp(`\\b${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  if (!match) throw new Error(`build-icons: no '${key}' found in src/lib/site.ts`);
  return match[1]
    .replace(/\\'/g, "'")
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const OG = {
  name: fromSite('shortName'),
  line: fromSite('headline'),
  foot: fromSite('study'),
};

const ogMark = await sharp(onDark).resize(92, 92).png().toBuffer();
const ogCard = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#14141a"/>
  <text x="80" y="372" font-family="Fraunces" font-size="82" fill="#eae8e3">${OG.name}</text>
  <text x="80" y="428" font-family="Inter" font-size="32" fill="#aeaaa2">${OG.line}</text>
  <line x1="80" y1="502" x2="1120" y2="502" stroke="#2f2f3a" stroke-width="1"/>
  <text x="80" y="546" font-family="Inter" font-size="24" fill="#89847b">${OG.foot}</text>
</svg>`);

files['og-default.png'] = await sharp(ogCard)
  .composite([{ input: ogMark, left: 80, top: 72 }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await mkdir(fileURLToPath(new URL('public', root)), { recursive: true });

let stale = 0;
for (const [name, buf] of Object.entries(files)) {
  const existing = await readFile(out(name)).catch(() => null);
  const same = existing?.equals(buf);
  if (same) continue;
  stale++;
  if (CHECK) {
    console.error(`stale: public/${name}`);
    continue;
  }
  await writeFile(out(name), buf);
  console.log(`wrote public/${name} (${(buf.length / 1024).toFixed(1)} kB)`);
}

if (CHECK && stale) {
  console.error(`\n${stale} icon(s) out of date — run \`pnpm icons\`.`);
  process.exit(1);
}
if (!stale) console.log('icons up to date');
