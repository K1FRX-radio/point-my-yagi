/**
 * Pure helpers for the "worked today" contact log. Identity is per activator +
 * park record; the day boundary is UTC (the amateur-radio convention).
 */

/** Stable key for a contact: activator callsign paired with a source record id. */
export function workedKey(callsign: string, recordId: string): string {
  return `${callsign.trim().toUpperCase()}|${recordId.trim().toUpperCase()}`;
}

/** UTC calendar day (YYYY-MM-DD) for an epoch-ms timestamp. */
export function utcDayKey(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}
