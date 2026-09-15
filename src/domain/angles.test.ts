import { describe, expect, it } from "vitest";

import { normalizeDegrees, signedRotation } from "./angles";

describe("normalizeDegrees", () => {
  const cases: [input: number, expected: number][] = [
    [0, 0],
    [360, 0],
    [361, 1],
    [-1, 359],
    [-361, 359],
    [720, 0],
    [450, 90],
    [-90, 270],
    [359.999, 359.999],
    [180, 180],
  ];

  it.each(cases)("normalizeDegrees(%f) -> %f", (input, expected) => {
    expect(normalizeDegrees(input)).toBeCloseTo(expected, 9);
  });

  it("always returns a value in [0, 360)", () => {
    for (let deg = -1000; deg <= 1000; deg += 7.3) {
      const result = normalizeDegrees(deg);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(360);
    }
  });
});

describe("signedRotation", () => {
  const cases: [from: number, to: number, expected: number][] = [
    [0, 0, 0],
    [0, 90, 90],
    [0, 180, 180], // exact reversal maps to +180
    [0, 181, -179],
    [0, 270, -90],
    [350, 10, 20], // shortest path crosses 0/360, turn right
    [10, 350, -20], // turn left across 0/360
    [0, -90, -90],
    [90, 0, -90],
    [45, 46, 1],
  ];

  it.each(cases)("signedRotation(%f, %f) -> %f", (from, to, expected) => {
    expect(signedRotation(from, to)).toBeCloseTo(expected, 9);
  });

  it("always returns a value in (-180, 180]", () => {
    for (let from = 0; from < 360; from += 13) {
      for (let to = 0; to < 360; to += 17) {
        const result = signedRotation(from, to);
        expect(result).toBeGreaterThan(-180);
        expect(result).toBeLessThanOrEqual(180);
      }
    }
  });
});
