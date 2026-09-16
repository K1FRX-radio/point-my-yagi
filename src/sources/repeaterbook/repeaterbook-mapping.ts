import { validateLatitude, validateLongitude, type Target } from "@/domain";

import { asRecord, getOptionalString, getString, SchemaError } from "../schema";

const DETAIL_URL = "https://www.repeaterbook.com/repeaters/details.php";

function parseNumber(value: string | undefined): number | undefined {
  if (value == null || value.trim() === "") {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Map one RepeaterBook export record to a {@link Target}. Only the minimum fields
 * needed for pointing are used. Throws {@link SchemaError} for missing/invalid
 * coordinates or ids so the caller can skip that record.
 *
 * NOTE: the response field names must be re-verified against the live Export API
 * once access is approved; this maps the documented/historical shape.
 */
export function mapRepeaterBookRecord(raw: unknown): Target {
  const obj = asRecord(raw, "repeater");
  const stateId = getString(obj, "State ID", "repeater");
  const rptrId = getString(obj, "Rptr ID", "repeater");
  const callsign = getString(obj, "Callsign", "repeater");

  const latitude = parseNumber(getOptionalString(obj, "Lat", "repeater"));
  const longitude = parseNumber(getOptionalString(obj, "Long", "repeater"));
  if (
    latitude == null ||
    longitude == null ||
    !validateLatitude(latitude) ||
    !validateLongitude(longitude)
  ) {
    throw new SchemaError("repeater Lat/Long missing or out of range");
  }

  const nearestCity = getOptionalString(obj, "Nearest City", "repeater");
  const state = getOptionalString(obj, "State", "repeater");
  const country = getOptionalString(obj, "Country", "repeater");
  const frequencyMhz = parseNumber(getOptionalString(obj, "Frequency", "repeater"));
  const mode = getOptionalString(obj, "Mode", "repeater");
  const precise = getOptionalString(obj, "Precise", "repeater");

  const precision = precise === "0" ? "approximate" : "exact";

  return {
    id: `repeaterbook:${stateId}-${rptrId}`,
    name: nearestCity ? `${callsign} — ${nearestCity}` : callsign,
    latitude,
    longitude,
    sourceType: "repeaterbook",
    sourceLabel: "RepeaterBook",
    frequencyMhz,
    mode: mode?.trim() ? mode.trim() : undefined,
    callsign,
    adminRegion: [state, country].filter(Boolean).join(", ") || undefined,
    sourceRecordId: `${stateId}-${rptrId}`,
    detailUrl: `${DETAIL_URL}?state_id=${encodeURIComponent(stateId)}&ID=${encodeURIComponent(rptrId)}`,
    precision,
    locationWarning:
      precision === "approximate" ? "RepeaterBook marks this location as approximate." : undefined,
  };
}

/** Map many records, skipping malformed ones. */
export function mapRepeaterBookRecords(rawRecords: unknown[]): Target[] {
  const targets: Target[] = [];
  for (const raw of rawRecords) {
    try {
      targets.push(mapRepeaterBookRecord(raw));
    } catch (error) {
      if (error instanceof SchemaError) {
        continue;
      }
      throw error;
    }
  }
  return targets;
}
