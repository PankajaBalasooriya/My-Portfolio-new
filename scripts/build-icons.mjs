/**
 * Regenerate the site icons in public/ from the brand masters.
 *
 *   pnpm icons                 # rewrite favicon.svg, favicon.png, apple-touch-icon.png
 *   pnpm icons --check         # fail if the committed icons are stale
 *
 * The masters in src/assets/brand are flat RGB — the artwork is already
 * composited onto solid white (mark-on-light) or solid black (mark-on-dark),
 * with no alpha of its own. Keying the background out by colour would eat the
 * blue wedge, so this un-mattes instead: it solves each pixel back to the
 * colour and coverage it had before compositing, which keeps anti-aliased
 * edges clean and the accent at full saturation.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const master = (name) => fileURLToPath(new URL(`src/assets/brand/${name}`, root));
const out = (name) => fileURLToPath(new URL(`public/${name}`, root));

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
