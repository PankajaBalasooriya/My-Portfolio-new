/** Words per minute for silent reading of technical prose. */
const WPM = 200;

/**
 * Estimate reading time from raw Markdown/MDX body text.
 * Fenced code and frontmatter-style noise are stripped so a long snippet
 * doesn't inflate the estimate.
 */
export function readingTime(body: string | undefined): string {
  const prose = (body ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^import .*$/gm, '');
  const words = prose.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / WPM))} min read`;
}
