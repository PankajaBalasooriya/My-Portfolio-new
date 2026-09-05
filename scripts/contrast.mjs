/**
 * Verify the palette in src/styles/global.css meets WCAG AA in both themes.
 *
 *   pnpm contrast
 *
 * Reads the tokens straight out of the stylesheet, so editing the palette
 * block re-checks the real values rather than a copy that can drift.
 */
import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');

/** Pairs that must hold in both themes: [foreground, background, minimum]. */
const PAIRS = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'surface', 4.5],
  // faint carries small meta text (dates, venues, badges) — AA normal, not large.
  ['faint', 'bg', 4.5],
  ['faint', 'surface', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['accent-hover', 'bg', 4.5],
  // Non-text UI (borders) only needs to be perceivable.
  ['border', 'bg', 1.2],
];

function parseBlock(selector) {
  const match = CSS.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`Could not find the "${selector}" block in global.css`);
  const tokens = {};
  for (const [, name, value] of match[1].matchAll(/--c-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[name] = value;
  }
  return tokens;
}

const srgb = (hex) => hex.slice(1).match(/../g).map((h) => parseInt(h, 16) / 255);
const linear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = srgb(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const themes = {
  light: parseBlock(':root'),
  dark: { ...parseBlock(':root'), ...parseBlock('\\.dark') },
};

let failures = 0;

for (const [name, tokens] of Object.entries(themes)) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [fg, bg, min] of PAIRS) {
    const fgHex = tokens[fg];
    const bgHex = tokens[bg];
    if (!fgHex || !bgHex) {
      console.log(`  MISSING token: ${!fgHex ? fg : bg}`);
      failures++;
      continue;
    }
    const ratio = contrast(fgHex, bgHex);
    const ok = ratio >= min;
    if (!ok) failures++;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${`${fg} on ${bg}`.padEnd(22)}` +
        `${ratio.toFixed(2).padStart(6)}:1  (min ${min})`,
    );
  }
}

console.log();
if (failures) {
  console.error(`${failures} contrast failure(s).`);
  process.exit(1);
}
console.log('Palette meets WCAG AA in both themes.');
