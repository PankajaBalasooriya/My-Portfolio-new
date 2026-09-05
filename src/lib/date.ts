/**
 * Date formatting.
 *
 * Blog dates are real `Date`s. CV dates are month-precision strings
 * ("2025-01") — deliberately not `Date`, so no invented day and no timezone
 * drift on the print stylesheet.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "5 September 2026" */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Machine-readable, for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

/** "2025-01" -> "January 2025"; "2025" -> "2025". */
export function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  if (!month) return year ?? value;
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : value;
}

/** "January 2025 — Present" */
export function formatRange(start: string, end?: string): string {
  return `${formatMonth(start)} — ${end ? formatMonth(end) : 'Present'}`;
}
