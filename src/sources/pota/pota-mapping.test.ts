import { describe, expect, it } from "vitest";

import spots from "./__fixtures__/activator-spots.json";
import { mapPotaSpot, mapPotaSpots } from "./pota-mapping";

describe("mapPotaSpot", () => {
  it("maps a normal spot to a park-level target", () => {
    const target = mapPotaSpot(spots[0]);
    expect(target).toMatchObject({
      name: "AE0XJ at Sherburne National Wildlife Refuge",
      latitude: 45.4839,
      longitude: -93.7112,
      sourceType: "pota",
      sourceLabel: "POTA",
      mode: "FT4",
      callsign: "AE0XJ",
      grid: "EN35dl",
      precision: "approximate",
    });
    expect(target.frequencyMhz).toBeCloseTo(14.08, 6);
    expect(target.detailUrl).toContain("US-0370");
    expect(target.adminRegion).toBe("US-MN");
    expect(target.locationWarning).toMatch(/exact position/);
    expect(target.observedAt).toBe(Date.parse("2026-09-15T21:45:48Z"));
  });

  it("omits an empty mode and keeps grid4 when grid6 is absent", () => {
    const target = mapPotaSpot(spots[1]);
    expect(target.mode).toBeUndefined();
    expect(target.grid).toBe("FM06");
  });

  it("parses a UHF frequency submitted in Hz", () => {
    const target = mapPotaSpot(spots[2]);
    expect(target.frequencyMhz).toBeCloseTo(436.795, 3);
    expect(target.callsign).toBe("CAYTER");
  });

  it("throws for a spot missing coordinates", () => {
    expect(() => mapPotaSpot(spots[3])).toThrow();
  });
});

describe("mapPotaSpots", () => {
  it("skips invalid spots and collapses duplicates to the newest", () => {
    const targets = mapPotaSpots(spots);
    // 6 raw: one has no coords (skipped), two are the same activator+park (deduped).
    expect(targets).toHaveLength(4);

    const utah = targets.filter((t) => t.detailUrl?.includes("US-3094"));
    expect(utah).toHaveLength(1);
    // The newer spot (21:45:11, FT8) wins over the older (21:42:48, CW).
    expect(utah[0].mode).toBe("FT8");
    expect(utah[0].observedAt).toBe(Date.parse("2026-09-15T21:45:11Z"));
  });
});
