import { describe, expect, it } from "vitest";

import { isSavedRef, toSavedTarget } from "./saved-target";
import type { Target } from "./target";

function repeaterbookTarget(): Target {
  return {
    id: "repeaterbook:06-1001",
    name: "W6ABC — San Francisco",
    latitude: 37.7749,
    longitude: -122.4194,
    sourceType: "repeaterbook",
    sourceLabel: "RepeaterBook",
    frequencyMhz: 146.94,
    mode: "analog",
    callsign: "W6ABC",
    sourceRecordId: "06-1001",
    detailUrl: "https://www.repeaterbook.com/repeaters/details.php?state_id=06&ID=1001",
    precision: "exact",
  };
}

function manualTarget(): Target {
  return {
    id: "manual:1",
    name: "Home",
    latitude: 10,
    longitude: 20,
    sourceType: "manual",
    sourceLabel: "Manual",
    precision: "high",
  };
}

describe("toSavedTarget", () => {
  it("reduces a RepeaterBook target to a non-locating reference", () => {
    const saved = toSavedTarget(repeaterbookTarget());
    expect(isSavedRef(saved)).toBe(true);
    expect(saved).toEqual({
      kind: "ref",
      id: "repeaterbook:06-1001",
      name: "W6ABC — San Francisco",
      sourceType: "repeaterbook",
      sourceLabel: "RepeaterBook",
      callsign: "W6ABC",
      sourceRecordId: "06-1001",
      detailUrl: "https://www.repeaterbook.com/repeaters/details.php?state_id=06&ID=1001",
    });
    expect(saved).not.toHaveProperty("latitude");
    expect(saved).not.toHaveProperty("longitude");
    expect(saved).not.toHaveProperty("frequencyMhz");
    expect(saved).not.toHaveProperty("mode");
  });

  it("keeps non-RepeaterBook targets in full", () => {
    const target = manualTarget();
    const saved = toSavedTarget(target);
    expect(isSavedRef(saved)).toBe(false);
    expect(saved).toBe(target);
  });

  it("is idempotent for an already-reduced reference", () => {
    const ref = toSavedTarget(repeaterbookTarget());
    expect(toSavedTarget(ref)).toBe(ref);
  });
});
