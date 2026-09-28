/**
 * Normalize and validate a callsign for a targeted RepeaterBook lookup.
 *
 * Returns the trimmed, upper-cased callsign, or `null` when the input is not a
 * valid single-callsign query. This is the source boundary that keeps the
 * "one targeted lookup" promise: it rejects empty input and RepeaterBook's `%`
 * wildcard so a lookup can never be turned into a broad harvest query.
 */
export function normalizeCallsign(text: string | undefined): string | null {
  if (text == null) {
    return null;
  }
  const trimmed = text.trim().toUpperCase();
  if (trimmed === "") {
    return null;
  }
  // Amateur callsigns are letters and digits, optionally with a `/` prefix or
  // suffix (portable/regional). Anything else, including RepeaterBook's `%`
  // wildcard, `*`, spaces, or commas, is not a targeted single-callsign query.
  if (!/^[A-Z0-9]+(?:\/[A-Z0-9]+)*$/.test(trimmed)) {
    return null;
  }
  // A callsign has at least one letter and one digit; this rejects all-letter or
  // all-digit noise that could broaden a query.
  if (!/[A-Z]/.test(trimmed) || !/[0-9]/.test(trimmed)) {
    return null;
  }
  return trimmed;
}
