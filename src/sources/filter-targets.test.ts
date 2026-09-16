import { describe, expect, it } from "vitest";

import type { Target } from "@/domain";

import { filterTargets } from "./filter-targets";

function target(overrides: Partial<Target>): Target {
  return {
    id: overrides.id ?? "t",
    name: overrides.name ?? "Park",
    latitude: overrides.latitude ?? 0,
    longitude: overrides.longitude ?? 0,
    sourceType: "pota",
    sourceLabel: "POTA",
    precision: "approximate",
    ...overrides,
  };
}

const TARGETS: Target[] = [
  target({
    id: "a",
    name: "AE0XJ at Sherburne",
    callsign: "AE0XJ",
    mode: "FT4",
    frequencyMhz: 14.08,
    grid: "EN35dl",
    adminRegion: "US-MN",
    latitude: 45.48,
    longitude: -93.71,
  }),
  target({
    id: "b",
    name: "N4GE at Alamance",
    callsign: "N4GE",
    frequencyMhz: 7.225,
    grid: "FM06",
    adminRegion: "US-NC",
    latitude: 36.0,
    longitude: -79.52,
  }),
  target({
    id: "c",
    name: "NA7C at Utah Lake",
    callsign: "NA7C",
    mode: "FT8",
    frequencyMhz: 14.074,
    grid: "DN40df",
    adminRegion: "US-UT",
    latitude: 40.24,
    longitude: -111.74,
  }),
];

describe("filterTargets", () => {
  it("filters by mode (case-insensitive)", () => {
    expect(filterTargets(TARGETS, { mode: "ft8" }).map((t) => t.id)).toEqual(["c"]);
  });

  it("filters by band", () => {
    expect(
      filterTargets(TARGETS, { band: "20m" })
        .map((t) => t.id)
        .sort(),
    ).toEqual(["a", "c"]);
    expect(filterTargets(TARGETS, { band: "40m" }).map((t) => t.id)).toEqual(["b"]);
  });

  it("filters by region against grid and admin region", () => {
    expect(filterTargets(TARGETS, { region: "US-UT" }).map((t) => t.id)).toEqual(["c"]);
    expect(
      filterTargets(TARGETS, { region: "us" })
        .map((t) => t.id)
        .sort(),
    ).toEqual(["a", "b", "c"]);
    expect(filterTargets(TARGETS, { region: "en35" }).map((t) => t.id)).toEqual(["a"]);
  });

  it("filters by text against name and callsign", () => {
    expect(filterTargets(TARGETS, { text: "na7c" }).map((t) => t.id)).toEqual(["c"]);
    expect(filterTargets(TARGETS, { text: "sherburne" }).map((t) => t.id)).toEqual(["a"]);
  });

  it("sorts by distance when near is provided", () => {
    const nearUtah = { latitude: 40.24, longitude: -111.74 };
    expect(filterTargets(TARGETS, { near: nearUtah }).map((t) => t.id)[0]).toBe("c");
  });

  it("applies maxResults last", () => {
    expect(filterTargets(TARGETS, { maxResults: 2 })).toHaveLength(2);
  });

  it("combines filters", () => {
    expect(
      filterTargets(TARGETS, { region: "US", band: "20m", mode: "ft8" }).map((t) => t.id),
    ).toEqual(["c"]);
  });
});
