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

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2025-01" -> "Jan 2025". Keeps timeline date ranges on one line. */
export function formatMonthShort(value: string): string {
  const [year, month] = value.split('-');
  if (!month) return year ?? value;
  const name = MONTHS_SHORT[Number(month) - 1];
  return name ? `${name} ${year}` : value;
}

/** "Jan 2025 — Present" */
export function formatRangeShort(start: string, end?: string): string {
  return `${formatMonthShort(start)} — ${end ? formatMonthShort(end) : 'Present'}`;
}

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

/** Months since year 0, for arithmetic on "YYYY" / "YYYY-MM" strings. */
export function monthIndex(value: string): number {
  const [year, month] = value.split('-');
  return Number(year) * 12 + (month ? Number(month) - 1 : 0);
}

/** The current month, used as the end of open-ended entries. */
export function nowIndex(): number {
  const now = new Date();
  return now.getUTCFullYear() * 12 + now.getUTCMonth();
}

/**
 * "7 mos", "1 yr", "2 yrs 4 mos". Inclusive of both endpoints, so a role
 * running January to January reads as 1 mo rather than 0.
 */
export function formatDuration(start: string, end?: string): string {
  const months = Math.max(1, (end ? monthIndex(end) : nowIndex()) - monthIndex(start) + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;

  const parts: string[] = [];
  if (years) parts.push(`${years} yr${years === 1 ? '' : 's'}`);
  if (rest) parts.push(`${rest} mo${rest === 1 ? '' : 's'}`);
  return parts.join(' ');
}
