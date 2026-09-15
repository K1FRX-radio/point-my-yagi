import { describe, expect, it } from "vitest";

import type { LatLon } from "./coordinates";
import { greatCircleDistanceMeters, initialBearingDeg } from "./geo";

const ORIGIN: LatLon = { latitude: 0, longitude: 0 };

// Tolerances:
// - Cardinal/antimeridian bearings are analytically exact; assert to 1e-6 deg.
// - Published city example bearing within 0.05 deg, distance within 2 km.
// - Equator arc-length within 0.5 m of the closed-form R * angle.

describe("initialBearingDeg", () => {
  const cardinal: [name: string, to: LatLon, expected: number][] = [
    ["due north", { latitude: 1, longitude: 0 }, 0],
    ["due east", { latitude: 0, longitude: 1 }, 90],
    ["due south", { latitude: -1, longitude: 0 }, 180],
    ["due west", { latitude: 0, longitude: -1 }, 270],
  ];

  it.each(cardinal)("points %s from the origin", (_name, to, expected) => {
    expect(initialBearingDeg(ORIGIN, to)).toBeCloseTo(expected, 6);
  });

  it("handles the antimeridian eastbound (179 -> -179) as due east", () => {
    expect(
      initialBearingDeg({ latitude: 0, longitude: 179 }, { latitude: 0, longitude: -179 }),
    ).toBeCloseTo(90, 6);
  });

  it("handles the antimeridian westbound (-179 -> 179) as due west", () => {
    expect(
      initialBearingDeg({ latitude: 0, longitude: -179 }, { latitude: 0, longitude: 179 }),
    ).toBeCloseTo(270, 6);
  });

  it("returns 0 for identical points", () => {
    expect(initialBearingDeg({ latitude: 5, longitude: 5 }, { latitude: 5, longitude: 5 })).toBe(0);
  });

  it("matches the published Land\u2019s End -> John o\u2019 Groats example", () => {
    // Reference: Chris Veness, movable-type.co.uk/scripts/latlong.html
    const p1: LatLon = { latitude: 50.0663889, longitude: -5.7147222 };
    const p2: LatLon = { latitude: 58.6438889, longitude: -3.07 };
    expect(initialBearingDeg(p1, p2)).toBeCloseTo(9.12, 1);
  });
});

describe("greatCircleDistanceMeters", () => {
  it("is 0 for identical points", () => {
    expect(greatCircleDistanceMeters(ORIGIN, ORIGIN)).toBe(0);
  });

  it("matches the closed-form arc length for 1 degree along the equator", () => {
    // R * (1 deg in radians) with EARTH_MEAN_RADIUS_METERS = 6_371_008.8.
    const d = greatCircleDistanceMeters(ORIGIN, { latitude: 0, longitude: 1 });
    expect(d).toBeCloseTo(111195.08, 2);
  });

  it("matches the published Land\u2019s End -> John o\u2019 Groats distance", () => {
    const p1: LatLon = { latitude: 50.0663889, longitude: -5.7147222 };
    const p2: LatLon = { latitude: 58.6438889, longitude: -3.07 };
    // Published ~968.9 km; allow 2 km for spherical-vs-ellipsoidal difference.
    expect(Math.abs(greatCircleDistanceMeters(p1, p2) - 968900)).toBeLessThan(2000);
  });

  it("is symmetric", () => {
    const a: LatLon = { latitude: 40.7128, longitude: -74.006 };
    const b: LatLon = { latitude: 51.5074, longitude: -0.1278 };
    expect(greatCircleDistanceMeters(a, b)).toBeCloseTo(greatCircleDistanceMeters(b, a), 6);
  });
});
