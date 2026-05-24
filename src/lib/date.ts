/**
 * Format a Date as YYYY-MM-DD in the user's *local* timezone.
 *
 * Avoid `d.toISOString().split('T')[0]` — that returns the UTC date, which
 * silently disagrees with what the user sees in their tile label when their
 * timezone is east of UTC and the wall clock is between local-midnight and
 * the UTC offset. The off-by-one shifts the date sent to the backend, which
 * then resolves to a different weekday and returns the wrong day's slots.
 */
export function toLocalIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Today as YYYY-MM-DD in the user's local timezone. */
export function todayLocalIsoDate(): string {
  return toLocalIsoDate(new Date());
}

const TIMEZONE_OFFSET_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Parse backend timestamps consistently.
 *
 * Spring often serializes Instant/UTC values as an offsetless LocalDateTime.
 * Browsers interpret those strings as local wall time, which makes a UTC
 * `20:53` render as `20:53` instead of `21:53` in Africa/Lagos. When the
 * backend includes an explicit offset we preserve it; only offsetless
 * date-times are treated as UTC.
 */
export function parseBackendDateTime(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (DATE_TIME_RE.test(value) && !TIMEZONE_OFFSET_RE.test(value)) {
    return new Date(`${value}Z`);
  }
  return new Date(value);
}
