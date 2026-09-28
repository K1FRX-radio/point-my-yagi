import { describe, expect, it } from "vitest";

import { decodeTarget, encodeTarget } from "./target-codec";
import type { Target } from "./target";

const fullTarget: Target = {
  id: "repeaterbook:06-1001",
  name: "W6ABC — San Francisco",
  latitude: 37.7749,
  longitude: -122.4194,
  sourceType: "repeaterbook",
  sourceLabel: "RepeaterBook",
  frequencyMhz: 146.94,
  mode: "FM",
  callsign: "W6ABC",
  sourceRecordId: "06-1001",
  grid: "CM87",
  adminRegion: "California, United States",
  detailUrl: "https://www.repeaterbook.com/repeaters/details.php?state_id=06&ID=1001",
  repeaterBookDataset: "na",
  precision: "exact",
  uncertaintyRadiusMeters: 0,
  locationWarning: "",
  observedAt: 1_700_000_000_000,
};

const minimalTarget: Target = {
  id: "manual:1",
  name: "Home",
  latitude: 40,
  longitude: -105,
  sourceType: "manual",
  sourceLabel: "Manual",
  precision: "high",
};

function withField(base: Target, patch: Record<string, unknown>): string {
  return JSON.stringify({ ...base, ...patch });
}

describe("encodeTarget/decodeTarget round-trip", () => {
  it("round-trips a full target", () => {
    expect(decodeTarget(encodeTarget(fullTarget))).toEqual(fullTarget);
  });

  it("round-trips a minimal target", () => {
    expect(decodeTarget(encodeTarget(minimalTarget))).toEqual(minimalTarget);
  });
});

describe("decodeTarget rejects invalid input", () => {
  it("rejects missing, empty, or non-JSON input", () => {
    expect(decodeTarget(undefined)).toBeNull();
    expect(decodeTarget(null)).toBeNull();
    expect(decodeTarget("")).toBeNull();
    expect(decodeTarget("not json")).toBeNull();
  });

  it("rejects non-object JSON", () => {
    expect(decodeTarget("123")).toBeNull();
    expect(decodeTarget('"a string"')).toBeNull();
    expect(decodeTarget("null")).toBeNull();
    expect(decodeTarget("[]")).toBeNull();
  });

  it("rejects missing or empty required string fields", () => {
    expect(decodeTarget(withField(minimalTarget, { id: "" }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { name: "" }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { sourceLabel: "" }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { id: 5 }))).toBeNull();
  });

  it("rejects non-finite or out-of-range coordinates", () => {
    expect(decodeTarget(withField(minimalTarget, { latitude: 91 }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { longitude: -181 }))).toBeNull();
    expect(
      decodeTarget(
        '{"id":"a","name":"n","sourceLabel":"s","latitude":1e999,' +
          '"longitude":0,"sourceType":"manual","precision":"high"}',
      ),
    ).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { latitude: "40" }))).toBeNull();
  });

  it("rejects unknown sourceType or precision", () => {
    expect(decodeTarget(withField(minimalTarget, { sourceType: "aprs" }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { precision: "perfect" }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { sourceType: undefined }))).toBeNull();
  });

  it("rejects wrong-typed optional fields", () => {
    expect(decodeTarget(withField(minimalTarget, { frequencyMhz: "146" }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { mode: 5 }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { observedAt: "yesterday" }))).toBeNull();
    expect(decodeTarget(withField(minimalTarget, { repeaterBookDataset: "eu" }))).toBeNull();
  });
});

describe("decodeTarget copies only whitelisted fields", () => {
  it("drops unexpected properties", () => {
    const decoded = decodeTarget(withField(minimalTarget, { evil: "payload", __hack: 1 }));
    expect(decoded).toEqual(minimalTarget);
    expect(decoded && "evil" in decoded).toBe(false);
  });
});
