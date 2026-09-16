import { normalizeDegrees, signedRotation } from "./angles";

/**
 * Circular exponential smoothing of an angle (degrees). Blends `sampleDeg` into
 * `previousDeg` by `alpha` (0 = keep previous, 1 = take sample) using unit
 * vectors so it behaves correctly across the 0/360 boundary. For nearly opposite
 * inputs the direction is ill-defined; callers should treat that as noise.
 */
export function blendAngleDeg(previousDeg: number, sampleDeg: number, alpha: number): number {
  const prev = (previousDeg * Math.PI) / 180;
  const sample = (sampleDeg * Math.PI) / 180;
  const x = (1 - alpha) * Math.cos(prev) + alpha * Math.cos(sample);
  const y = (1 - alpha) * Math.sin(prev) + alpha * Math.sin(sample);
  return normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
}

export type TurnDirection = "left" | "right" | "aligned";

export interface TurnInstruction {
  /** Signed shortest rotation from heading to bearing, (-180, 180]. */
  rotation: number;
  direction: TurnDirection;
  aligned: boolean;
}

/**
 * Turn needed to point a device heading at a target bearing. `aligned` is true
 * when within `toleranceDeg` (inclusive); positive rotation means turn right.
 */
export function turnInstruction(
  headingDeg: number,
  bearingDeg: number,
  toleranceDeg: number,
): TurnInstruction {
  const rotation = signedRotation(headingDeg, bearingDeg);
  const aligned = Math.abs(rotation) <= toleranceDeg;
  const direction: TurnDirection = aligned ? "aligned" : rotation > 0 ? "right" : "left";
  return { rotation, direction, aligned };
}

/**
 * Magnetic declination (degrees) from a paired true/magnetic heading reading:
 * trueHeading = magneticHeading + declination.
 */
export function declinationFromHeadings(trueDeg: number, magneticDeg: number): number {
  return signedRotation(magneticDeg, trueDeg);
}

/** Convert a true bearing/heading to magnetic given the local declination. */
export function trueToMagnetic(trueDeg: number, declinationDeg: number): number {
  return normalizeDegrees(trueDeg - declinationDeg);
}
