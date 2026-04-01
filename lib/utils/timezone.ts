export const DEFAULT_TIMEZONE = "America/Bogota";

export function getSafeTimezone(timezone: string | null | undefined): string {
  if (!timezone) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function getDayKey(isoDate: string, timezone: string): string {
  return new Date(isoDate).toLocaleDateString("en-CA", { timeZone: timezone });
}
