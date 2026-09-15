/**
 * Angle helpers. All values are in degrees.
 */

/**
 * Normalize any angle in degrees to the range [0, 360).
 * Examples: 360 -> 0, -90 -> 270, 450 -> 90.
 */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Signed shortest rotation (degrees) from a current heading to a target bearing.
 * Result is in (-180, 180]: positive means turn clockwise (right), negative
 * means counterclockwise (left). An exact reversal returns +180.
 */
export function signedRotation(fromHeadingDeg: number, toBearingDeg: number): number {
  const diff = normalizeDegrees(toBearingDeg - fromHeadingDeg);
  return diff > 180 ? diff - 360 : diff;
}
