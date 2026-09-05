/**
 * Base-path-safe URL helpers.
 *
 * The site may be served from `/` (custom domain) or from `/<repo>/` (the
 * GitHub Pages preview). Nothing in this codebase may hardcode a leading-slash
 * path — every internal href and asset URL goes through `url()`.
 */

const BASE = import.meta.env.BASE_URL;

/** Join a site-root-relative path onto the configured base path. */
export function url(path = '/'): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const joined = `${base}${suffix}`;
  return joined === '' ? '/' : joined;
}

/**
 * Absolute URL for a site-root-relative path (base path applied).
 * Use for links you author, e.g. absoluteUrl('/og-default.png', Astro.site).
 */
export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(url(path), site).href;
}

/**
 * Absolute URL for a pathname that ALREADY includes the base path — notably
 * `Astro.url.pathname`. Passing that through absoluteUrl() would apply the
 * base twice, which is invisible at base='/' and breaks every canonical and
 * og:url under a subpath.
 */
export function absoluteFromPathname(pathname: string, site: URL | undefined): string {
  return new URL(pathname, site).href;
}

/** Strip the base path and any trailing slash, for nav active-state checks. */
export function normalizePath(pathname: string): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  let p = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p === '' ? '/' : p;
}

/** True when `href` is the current page or one of its ancestors. */
export function isActive(currentPathname: string, href: string): boolean {
  const current = normalizePath(currentPathname);
  const target = normalizePath(href);
  if (target === '/') return current === '/';
  return current === target || current.startsWith(`${target}/`);
}
