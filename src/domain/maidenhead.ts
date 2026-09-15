import type { LatLon } from "./coordinates";

/** Valid Maidenhead locator lengths (field, square, subsquare, extended square). */
export type MaidenheadLength = 2 | 4 | 6 | 8;

// Degrees spanned by one unit of each successive pair, for longitude and latitude.
const LON_UNITS = [20, 2, 5 / 60, 0.5 / 60];
const LAT_UNITS = [10, 1, 2.5 / 60, 0.25 / 60];

const PATTERNS: Record<MaidenheadLength, RegExp> = {
  2: /^[A-R]{2}$/,
  4: /^[A-R]{2}[0-9]{2}$/,
  6: /^[A-R]{2}[0-9]{2}[A-X]{2}$/,
  8: /^[A-R]{2}[0-9]{2}[A-X]{2}[0-9]{2}$/,
};

/** True if `locator` is a well-formed 2/4/6/8-character Maidenhead locator. */
export function isValidMaidenhead(locator: string): boolean {
  if (typeof locator !== "string") {
    return false;
  }
  const normalized = locator.trim().toUpperCase();
  const pattern = PATTERNS[normalized.length as MaidenheadLength];
  return pattern !== undefined && pattern.test(normalized);
}

/**
 * Convert a Maidenhead locator to the center point of the cell it names.
 * Throws if the locator is not valid; check {@link isValidMaidenhead} first when
 * handling untrusted input.
 */
export function maidenheadToCenter(locator: string): LatLon {
  const normalized = locator.trim().toUpperCase();
  if (!isValidMaidenhead(normalized)) {
    throw new Error(`Invalid Maidenhead locator: ${JSON.stringify(locator)}`);
  }

  let longitude = -180;
  let latitude = -90;
  const pairs = normalized.length / 2;

  for (let i = 0; i < pairs; i++) {
    const lonChar = normalized[2 * i];
    const latChar = normalized[2 * i + 1];
    // Even pairs (field, subsquare) are letters; odd pairs (square, extended) are digits.
    const isLetterPair = i % 2 === 0;
    const base = isLetterPair ? 65 : 48; // 'A' or '0'
    longitude += (lonChar.charCodeAt(0) - base) * LON_UNITS[i];
    latitude += (latChar.charCodeAt(0) - base) * LAT_UNITS[i];
  }

  const last = pairs - 1;
  longitude += LON_UNITS[last] / 2;
  latitude += LAT_UNITS[last] / 2;

  return { latitude, longitude };
}
