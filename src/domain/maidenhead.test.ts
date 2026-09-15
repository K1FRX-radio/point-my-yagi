import { describe, expect, it } from "vitest";

import { isValidMaidenhead, maidenheadToCenter } from "./maidenhead";

describe("isValidMaidenhead", () => {
  const valid = ["AA", "RR", "FN31", "FN31pr", "JN58TD", "FN31pr00", "jn58td"];
  const invalid = [
    "",
    "A",
    "ABC",
    "SS", // field letters only go to R
    "FN3", // odd length
    "FN3A", // square must be digits
    "FN31zz", // subsquare letters only go to X
    "FN31prAA", // extended must be digits
    "FN31pr000", // odd length
  ];

  it.each(valid)("accepts %s", (locator) => {
    expect(isValidMaidenhead(locator)).toBe(true);
  });

  it.each(invalid)("rejects %s", (locator) => {
    expect(isValidMaidenhead(locator)).toBe(false);
  });
});

describe("maidenheadToCenter", () => {
  // [locator, latitude, longitude]. Tolerances documented per case below.
  const cases: [locator: string, lat: number, lon: number][] = [
    ["AA", -85, -170], // 2-char field center
    ["RR", 85, 170], // opposite field corner
    ["AA00", -89.5, -179], // 4-char square center
    ["FN31", 41.5, -73], // 4-char square center (Newington, CT area)
    ["FN31pr", 41.729167, -72.708333], // 6-char subsquare (published)
    ["JN58td", 48.145833, 11.625], // 6-char subsquare, Munich (published)
    ["FN31pr00", 41.710417, -72.745833], // 8-char extended square center
  ];

  it.each(cases)("%s -> center", (locator, lat, lon) => {
    const center = maidenheadToCenter(locator);
    // 6 decimals of a degree is ~0.1 m, far tighter than any source precision.
    expect(center.latitude).toBeCloseTo(lat, 4);
    expect(center.longitude).toBeCloseTo(lon, 4);
  });

  it("is case-insensitive", () => {
    expect(maidenheadToCenter("jn58td")).toEqual(maidenheadToCenter("JN58TD"));
  });

  it("throws on invalid input", () => {
    expect(() => maidenheadToCenter("nope")).toThrow(/Invalid Maidenhead/);
  });
});
