/** Where a target came from. */
export type TargetSourceType = "manual" | "pota" | "repeaterbook" | "qrz";

/**
 * How trustworthy a target's coordinates are. Drives the uncertainty indicator
 * so the UI never presents a bearing as more precise than the source supports.
 * - `exact`: surveyed point (e.g. a repeater tower).
 * - `high`: GPS-quality or precisely entered coordinate.
 * - `approximate`: park-level (POTA) or Maidenhead grid-center.
 * - `low`: derived from ZIP/state/country (e.g. some QRZ records).
 * - `unknown`: source did not indicate quality.
 */
export type TargetPrecision = "exact" | "high" | "approximate" | "low" | "unknown";

/** A place to point the antenna at, normalized across all sources. */
export interface Target {
  /** Stable identifier, unique within its source. */
  id: string;
  /** Human-readable display name. */
  name: string;
  latitude: number;
  longitude: number;
  sourceType: TargetSourceType;
  /** Short attribution label shown in the UI, e.g. "Manual" or "POTA". */
  sourceLabel: string;
  frequencyMhz?: number;
  mode?: string;
  callsign?: string;
  /** Maidenhead grid locator, when known. */
  grid?: string;
  /** Link to the source record, for attribution/details. */
  detailUrl?: string;
  precision: TargetPrecision;
  /** Estimated radius of positional uncertainty in meters, when known. */
  uncertaintyRadiusMeters?: number;
  /** Human-readable caveat about the location, e.g. park-vs-operator position. */
  locationWarning?: string;
}
