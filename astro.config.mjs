// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Both are overridable so the GitHub Pages preview can serve from a subpath
// before the custom-domain cutover. See DEPLOY.md.
const site = process.env.PUBLIC_SITE ?? 'https://pankajabalasooriya.me';
const base = process.env.PUBLIC_BASE ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
      defaultColor: false,
      wrap: true,
    },
  },
});
