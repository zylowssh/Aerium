/**
 * Parse backend timestamps consistently.
 *
 * The backend often emits UTC timestamps without a timezone suffix (e.g. "2026-04-16T08:30:00").
 * Browsers interpret those as local time, which shifts displayed hours for non-UTC users.
 * We normalize naive ISO strings to UTC by appending "Z" before parsing.
 */
export const parseBackendDate = (value?: string | Date | null): Date => {
  if (value instanceof Date) {
    return value;
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return new Date(NaN);
  }

  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const parsed = new Date(normalized);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  // Last-chance fallback for uncommon date formats.
  return new Date(raw);
};
