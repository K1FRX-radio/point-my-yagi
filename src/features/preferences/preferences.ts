import type { DistanceUnit } from "@/domain";

/** Whether numeric bearing/heading are shown as true or magnetic (always labeled). */
export type BearingDisplay = "true" | "magnetic";

export interface Preferences {
  distanceUnit: DistanceUnit;
  bearingDisplay: BearingDisplay;
  /** Degrees within which the pointer reports "on target". */
  alignmentToleranceDeg: number;
  /** Whether to fire a haptic when alignment is reached. */
  hapticsNearAlignment: boolean;
  /** Use the high-contrast outdoor color scheme. */
  highContrast: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  distanceUnit: "imperial",
  bearingDisplay: "true",
  alignmentToleranceDeg: 5,
  hapticsNearAlignment: true,
  highContrast: false,
};

/** Selectable alignment tolerances (degrees). */
export const TOLERANCE_OPTIONS = [3, 5, 10, 15] as const;

/** Merge stored (possibly partial/old) preferences onto the defaults. */
export function normalizePreferences(stored: unknown): Preferences {
  if (typeof stored !== "object" || stored === null) {
    return { ...DEFAULT_PREFERENCES };
  }
  const s = stored as Partial<Preferences>;
  return {
    distanceUnit: s.distanceUnit === "metric" ? "metric" : DEFAULT_PREFERENCES.distanceUnit,
    bearingDisplay:
      s.bearingDisplay === "magnetic" ? "magnetic" : DEFAULT_PREFERENCES.bearingDisplay,
    alignmentToleranceDeg: TOLERANCE_OPTIONS.includes(
      s.alignmentToleranceDeg as (typeof TOLERANCE_OPTIONS)[number],
    )
      ? (s.alignmentToleranceDeg as number)
      : DEFAULT_PREFERENCES.alignmentToleranceDeg,
    hapticsNearAlignment:
      typeof s.hapticsNearAlignment === "boolean"
        ? s.hapticsNearAlignment
        : DEFAULT_PREFERENCES.hapticsNearAlignment,
    highContrast:
      typeof s.highContrast === "boolean" ? s.highContrast : DEFAULT_PREFERENCES.highContrast,
  };
}
