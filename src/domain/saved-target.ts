import type { Target, TargetSourceType } from "./target";

/**
 * At-rest form of a saved target that intentionally omits location data. Used for
 * RepeaterBook entries so no RepeaterBook coordinates are persisted on the device;
 * the full record is re-fetched live when the entry is opened.
 */
export interface SavedTargetRef {
  kind: "ref";
  id: string;
  name: string;
  sourceType: TargetSourceType;
  sourceLabel: string;
  callsign?: string;
  sourceRecordId?: string;
  detailUrl?: string;
}

/** A saved list entry: a full target (manual/POTA) or a non-locating reference. */
export type SavedTarget = Target | SavedTargetRef;

/** Narrow a saved entry to its non-locating reference form. */
export function isSavedRef(saved: SavedTarget): saved is SavedTargetRef {
  return "kind" in saved && saved.kind === "ref";
}

/**
 * Reduce a target (or already-saved entry) to its at-rest form. RepeaterBook
 * targets become a non-locating reference (no coordinates, frequency, or mode);
 * other sources are stored in full. Idempotent for entries already reduced.
 */
export function toSavedTarget(value: Target | SavedTarget): SavedTarget {
  if (isSavedRef(value)) {
    return value;
  }
  if (value.sourceType === "repeaterbook") {
    return {
      kind: "ref",
      id: value.id,
      name: value.name,
      sourceType: value.sourceType,
      sourceLabel: value.sourceLabel,
      callsign: value.callsign,
      sourceRecordId: value.sourceRecordId,
      detailUrl: value.detailUrl,
    };
  }
  return value;
}
