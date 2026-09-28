import { validateLatitude, validateLongitude } from "./coordinates";
import type { RepeaterBookDataset, Target, TargetPrecision, TargetSourceType } from "./target";

const SOURCE_TYPES: readonly TargetSourceType[] = ["manual", "pota", "repeaterbook", "qrz"];
const PRECISIONS: readonly TargetPrecision[] = ["exact", "high", "approximate", "low", "unknown"];
const DATASETS: readonly RepeaterBookDataset[] = ["na", "row"];

/** Serialize a target for a navigation param / deep link. */
export function encodeTarget(target: Target): string {
  return JSON.stringify(target);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isOptionalString(v: unknown): boolean {
  return v === undefined || typeof v === "string";
}

function isOptionalFiniteNumber(v: unknown): boolean {
  return v === undefined || (typeof v === "number" && Number.isFinite(v));
}

/**
 * Parse a target from an untrusted string (navigation param / deep link).
 *
 * Routes are URL/deep-link based, so this treats the payload as untrusted and
 * returns null unless every field is present and well-typed: finite in-range
 * coordinates, non-empty id/name/sourceLabel, a known sourceType and precision,
 * and optional fields matching their expected types. Only whitelisted fields are
 * copied, so unexpected properties never pass through.
 */
export function decodeTarget(raw: string | undefined | null): Target | null {
  if (!raw) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const v = parsed as Record<string, unknown>;

  if (!isNonEmptyString(v.id) || !isNonEmptyString(v.name) || !isNonEmptyString(v.sourceLabel)) {
    return null;
  }
  if (typeof v.latitude !== "number" || typeof v.longitude !== "number") {
    return null;
  }
  if (!validateLatitude(v.latitude) || !validateLongitude(v.longitude)) {
    return null;
  }
  if (!SOURCE_TYPES.includes(v.sourceType as TargetSourceType)) {
    return null;
  }
  if (!PRECISIONS.includes(v.precision as TargetPrecision)) {
    return null;
  }
  if (
    !isOptionalFiniteNumber(v.frequencyMhz) ||
    !isOptionalString(v.mode) ||
    !isOptionalString(v.callsign) ||
    !isOptionalString(v.sourceRecordId) ||
    !isOptionalString(v.grid) ||
    !isOptionalString(v.adminRegion) ||
    !isOptionalString(v.detailUrl) ||
    !isOptionalFiniteNumber(v.uncertaintyRadiusMeters) ||
    !isOptionalString(v.locationWarning) ||
    !isOptionalFiniteNumber(v.observedAt)
  ) {
    return null;
  }
  if (
    v.repeaterBookDataset !== undefined &&
    !DATASETS.includes(v.repeaterBookDataset as RepeaterBookDataset)
  ) {
    return null;
  }

  const target: Target = {
    id: v.id,
    name: v.name,
    latitude: v.latitude,
    longitude: v.longitude,
    sourceType: v.sourceType as TargetSourceType,
    sourceLabel: v.sourceLabel,
    precision: v.precision as TargetPrecision,
  };
  if (v.frequencyMhz !== undefined) target.frequencyMhz = v.frequencyMhz as number;
  if (v.mode !== undefined) target.mode = v.mode as string;
  if (v.callsign !== undefined) target.callsign = v.callsign as string;
  if (v.sourceRecordId !== undefined) target.sourceRecordId = v.sourceRecordId as string;
  if (v.grid !== undefined) target.grid = v.grid as string;
  if (v.adminRegion !== undefined) target.adminRegion = v.adminRegion as string;
  if (v.detailUrl !== undefined) target.detailUrl = v.detailUrl as string;
  if (v.repeaterBookDataset !== undefined) {
    target.repeaterBookDataset = v.repeaterBookDataset as RepeaterBookDataset;
  }
  if (v.uncertaintyRadiusMeters !== undefined) {
    target.uncertaintyRadiusMeters = v.uncertaintyRadiusMeters as number;
  }
  if (v.locationWarning !== undefined) target.locationWarning = v.locationWarning as string;
  if (v.observedAt !== undefined) target.observedAt = v.observedAt as number;
  return target;
}
