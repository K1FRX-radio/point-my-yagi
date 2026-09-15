/** A WGS84 geographic coordinate in decimal degrees. */
export interface LatLon {
  latitude: number;
  longitude: number;
}

export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;

/** Result of parsing untrusted input at a system boundary. */
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateLatitude(value: number): boolean {
  return isFiniteNumber(value) && value >= LATITUDE_MIN && value <= LATITUDE_MAX;
}

export function validateLongitude(value: number): boolean {
  return isFiniteNumber(value) && value >= LONGITUDE_MIN && value <= LONGITUDE_MAX;
}

function parseDegrees(input: string, label: string, min: number, max: number): ParseResult<number> {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { ok: false, error: `${label} is required.` };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: `${label} must be a number.` };
  }
  if (value < min || value > max) {
    return { ok: false, error: `${label} must be between ${min} and ${max}.` };
  }
  return { ok: true, value };
}

/** Parse and range-check a latitude from user text input. */
export function parseLatitude(input: string): ParseResult<number> {
  return parseDegrees(input, "Latitude", LATITUDE_MIN, LATITUDE_MAX);
}

/** Parse and range-check a longitude from user text input. */
export function parseLongitude(input: string): ParseResult<number> {
  return parseDegrees(input, "Longitude", LONGITUDE_MIN, LONGITUDE_MAX);
}
