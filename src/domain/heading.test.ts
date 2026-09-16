import { describe, expect, it } from "vitest";

import { blendAngleDeg, declinationFromHeadings, trueToMagnetic, turnInstruction } from "./heading";

describe("blendAngleDeg", () => {
  it("returns the previous angle when alpha is 0", () => {
    expect(blendAngleDeg(100, 200, 0)).toBeCloseTo(100, 6);
  });

  it("returns the sample when alpha is 1", () => {
    expect(blendAngleDeg(100, 200, 1)).toBeCloseTo(200, 6);
  });

  it("blends toward the midpoint at alpha 0.5", () => {
    expect(blendAngleDeg(10, 20, 0.5)).toBeCloseTo(15, 6);
  });

  it("blends correctly across the 0/360 boundary", () => {
    // Midpoint of 350 and 10 is 0 (360), not 180.
    expect(blendAngleDeg(350, 10, 0.5)).toBeCloseTo(0, 6);
  });

  it("always returns a value in [0, 360)", () => {
    for (let prev = 0; prev < 360; prev += 31) {
      for (let sample = 0; sample < 360; sample += 37) {
        const result = blendAngleDeg(prev, sample, 0.3);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
      }
    }
  });
});

describe("turnInstruction", () => {
  const tol = 5;
  const cases: [
    heading: number,
    bearing: number,
    rotation: number,
    direction: string,
    aligned: boolean,
  ][] = [
    [0, 90, 90, "right", false],
    [90, 0, -90, "left", false],
    [0, 3, 3, "aligned", true],
    [0, 358, -2, "aligned", true],
    [0, 5, 5, "aligned", true], // tolerance is inclusive
    [350, 10, 20, "right", false],
    [10, 350, -20, "left", false],
  ];

  it.each(cases)(
    "heading %f -> bearing %f gives %f (%s)",
    (heading, bearing, rotation, direction, aligned) => {
      const result = turnInstruction(heading, bearing, tol);
      expect(result.rotation).toBeCloseTo(rotation, 6);
      expect(result.direction).toBe(direction);
      expect(result.aligned).toBe(aligned);
    },
  );
});

describe("declination and magnetic conversion", () => {
  it("derives declination as true minus magnetic", () => {
    // true = mag + declination; here 15 = 5 + 10.
    expect(declinationFromHeadings(15, 5)).toBeCloseTo(10, 6);
    // West declination (true less than magnetic) is negative.
    expect(declinationFromHeadings(350, 5)).toBeCloseTo(-15, 6);
  });

  it("converts a true bearing to magnetic and round-trips", () => {
    expect(trueToMagnetic(41, 10)).toBeCloseTo(31, 6);
    expect(trueToMagnetic(5, 10)).toBeCloseTo(355, 6);
    const declination = declinationFromHeadings(41, 31);
    expect(trueToMagnetic(41, declination)).toBeCloseTo(31, 6);
  });
});
