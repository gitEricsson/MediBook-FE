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
 * The MediBook backend stores appointment times as LocalDateTime in the
 * Africa/Lagos timezone and serialises them without an offset suffix
 * (e.g. "2025-06-01T13:00:00"). Browsers parse offsetless ISO strings as
 * **local wall time**, which is correct here because the user's browser is
 * also in Africa/Lagos. Previously this function appended "Z" (treating the
 * value as UTC), which added a spurious +1 h offset when displayed.
 *
 * When the backend *does* include an explicit offset (e.g. from an Instant
 * field) we honour it as-is.
 */
export function parseBackendDateTime(value: string | Date): Date {
  if (value instanceof Date) return value;
  // Offsetless date-times are local wall time — parse as-is (no "Z" suffix).
  // Strings that already carry an offset (Z, +01:00, etc.) are also fine as-is.
  return new Date(value);
}
