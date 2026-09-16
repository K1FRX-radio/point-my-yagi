import { describe, expect, it } from "vitest";

import fixture from "./__fixtures__/export-records.json";
import { mapRepeaterBookRecord, mapRepeaterBookRecords } from "./repeaterbook-mapping";

const records = fixture.results;

describe("mapRepeaterBookRecord", () => {
  it("maps a precise repeater to an exact target", () => {
    const target = mapRepeaterBookRecord(records[0]);
    expect(target).toMatchObject({
      name: "W6ABC — San Francisco",
      latitude: 37.7749,
      longitude: -122.4194,
      sourceType: "repeaterbook",
      sourceLabel: "RepeaterBook",
      mode: "analog",
      callsign: "W6ABC",
      precision: "exact",
      sourceRecordId: "06-1001",
    });
    expect(target.frequencyMhz).toBeCloseTo(146.94, 5);
    expect(target.detailUrl).toContain("state_id=06");
    expect(target.detailUrl).toContain("ID=1001");
    expect(target.adminRegion).toBe("California, United States");
    expect(target.locationWarning).toBeUndefined();
  });

  it("flags an imprecise repeater as approximate with a warning", () => {
    const target = mapRepeaterBookRecord(records[1]);
    expect(target.precision).toBe("approximate");
    expect(target.locationWarning).toMatch(/approximate/);
    expect(target.mode).toBe("DMR");
  });

  it("throws for a record without coordinates", () => {
    expect(() => mapRepeaterBookRecord(records[2])).toThrow();
  });
});

describe("mapRepeaterBookRecords", () => {
  it("skips records that cannot be mapped", () => {
    const targets = mapRepeaterBookRecords(records);
    expect(targets.map((t) => t.callsign)).toEqual(["W6ABC", "K5XYZ"]);
  });
});
