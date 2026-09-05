/**
 * Browser-chrome colours for <meta name="theme-color">.
 *
 * Read out of the stylesheet at build time so they cannot drift from the
 * palette: retheming still means editing only the one block in global.css.
 */
import css from '../styles/global.css?raw';

function backgroundOf(selector: string): string {
  const block = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  const value = block?.[1]?.match(/--c-bg:\s*(#[0-9a-fA-F]{6})/);
  if (!value?.[1]) {
    throw new Error(`theme.ts: could not read --c-bg from "${selector}" in global.css`);
  }
  return value[1];
}

export const themeColors = {
  light: backgroundOf(':root'),
  dark: backgroundOf('\\.dark'),
} as const;

export type ThemeMode = 'system' | 'light' | 'dark';
