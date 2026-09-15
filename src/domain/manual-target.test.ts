import { describe, expect, it } from "vitest";

import { buildManualTarget } from "./manual-target";

describe("buildManualTarget (coordinates)", () => {
  it("builds a high-precision manual target", () => {
    const result = buildManualTarget({
      kind: "coordinates",
      latitude: "41.7292",
      longitude: "-72.7083",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      latitude: 41.7292,
      longitude: -72.7083,
      sourceType: "manual",
      precision: "high",
    });
  });

  it("uses a provided name, otherwise formats the coordinate", () => {
    const named = buildManualTarget({
      kind: "coordinates",
      latitude: "10",
      longitude: "20",
      name: "  Repeater A  ",
    });
    expect(named.ok && named.value.name).toBe("Repeater A");

    const unnamed = buildManualTarget({
      kind: "coordinates",
      latitude: "10",
      longitude: "20",
    });
    expect(unnamed.ok && unnamed.value.name).toBe("10.00000, 20.00000");
  });

  it("rejects an invalid latitude", () => {
    const result = buildManualTarget({
      kind: "coordinates",
      latitude: "999",
      longitude: "0",
    });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/between/) });
  });

  it("rejects empty longitude", () => {
    const result = buildManualTarget({
      kind: "coordinates",
      latitude: "0",
      longitude: "  ",
    });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/required/) });
  });
});

describe("buildManualTarget (grid)", () => {
  it("builds an approximate grid target from the cell center", () => {
    const result = buildManualTarget({ kind: "grid", grid: "fn31pr" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      grid: "FN31PR",
      sourceType: "manual",
      precision: "approximate",
    });
    expect(result.value.latitude).toBeCloseTo(41.729167, 4);
    expect(result.value.longitude).toBeCloseTo(-72.708333, 4);
    expect(result.value.uncertaintyRadiusMeters).toBeGreaterThan(0);
  });

  it("defaults the name to the normalized locator", () => {
    const result = buildManualTarget({ kind: "grid", grid: "jn58td" });
    expect(result.ok && result.value.name).toBe("JN58TD");
  });

  it("rejects an invalid locator", () => {
    const result = buildManualTarget({ kind: "grid", grid: "nope" });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/Maidenhead/) });
  });
});
