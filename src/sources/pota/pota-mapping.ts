import { frequencyKhzToMhz, validateLatitude, validateLongitude, type Target } from "@/domain";

import {
  asRecord,
  getNumber,
  getOptionalNumber,
  getOptionalString,
  getString,
  SchemaError,
} from "../schema";

const POTA_PARK_URL = "https://pota.app/#/park/";

function readFrequency(obj: Record<string, unknown>): string | number | undefined {
  const value = obj.frequency;
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

// POTA spot times are UTC without an offset; append Z so Date.parse treats them as UTC.
function parseSpotTime(spotTime: string | undefined): number | undefined {
  if (!spotTime) {
    return undefined;
  }
  const hasOffset = /(Z|[+-]\d\d:?\d\d)$/.test(spotTime);
  const ms = Date.parse(hasOffset ? spotTime : `${spotTime}Z`);
  return Number.isFinite(ms) ? ms : undefined;
}

/**
 * Map one raw POTA activator spot to a {@link Target}. Throws {@link SchemaError}
 * when required fields (coordinates, reference, activator) are missing or invalid,
 * so the caller can skip that spot without failing the whole response.
 */
export function mapPotaSpot(raw: unknown): Target {
  const obj = asRecord(raw, "spot");
  const latitude = getNumber(obj, "latitude", "spot");
  const longitude = getNumber(obj, "longitude", "spot");
  if (!validateLatitude(latitude) || !validateLongitude(longitude)) {
    throw new SchemaError("spot latitude/longitude out of range");
  }

  const reference = getString(obj, "reference", "spot");
  const activator = getString(obj, "activator", "spot");
  const parkName =
    getOptionalString(obj, "name", "spot") ??
    getOptionalString(obj, "parkName", "spot") ??
    reference;

  const modeRaw = getOptionalString(obj, "mode", "spot");
  const mode = modeRaw && modeRaw.trim() ? modeRaw.trim() : undefined;
  const frequencyMhz = frequencyKhzToMhz(readFrequency(obj));
  const grid = getOptionalString(obj, "grid6", "spot") ?? getOptionalString(obj, "grid4", "spot");
  const adminRegion = getOptionalString(obj, "locationDesc", "spot");
  const spotId = getOptionalNumber(obj, "spotId", "spot");
  const observedAt = parseSpotTime(getOptionalString(obj, "spotTime", "spot"));

  return {
    id: `pota:${spotId ?? `${reference}:${activator}`}`,
    name: `${activator} at ${parkName}`,
    latitude,
    longitude,
    sourceType: "pota",
    sourceLabel: "POTA",
    frequencyMhz,
    mode,
    callsign: activator,
    grid,
    adminRegion,
    sourceRecordId: reference,
    detailUrl: `${POTA_PARK_URL}${reference}`,
    precision: "approximate",
    locationWarning: `Park-representative location for ${reference}. The activator's exact position within the park is unknown.`,
    observedAt,
  };
}

/**
 * Map an array of raw spots, skipping malformed ones and collapsing duplicates
 * (same activator + park) to the most recently observed.
 */
export function mapPotaSpots(rawSpots: unknown[]): Target[] {
  const mapped: Target[] = [];
  for (const raw of rawSpots) {
    try {
      mapped.push(mapPotaSpot(raw));
    } catch (error) {
      if (error instanceof SchemaError) {
        continue;
      }
      throw error;
    }
  }

  const newestByActivatorPark = new Map<string, Target>();
  for (const target of mapped) {
    const key = `${target.callsign ?? ""}|${target.detailUrl ?? ""}`;
    const existing = newestByActivatorPark.get(key);
    if (!existing || (target.observedAt ?? 0) > (existing.observedAt ?? 0)) {
      newestByActivatorPark.set(key, target);
    }
  }
  return [...newestByActivatorPark.values()];
}
