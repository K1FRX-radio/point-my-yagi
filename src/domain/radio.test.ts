import { describe, expect, it } from "vitest";

import { bandForMhz, frequencyKhzToMhz } from "./radio";

describe("frequencyKhzToMhz", () => {
  it("converts numeric strings and numbers from kHz to MHz", () => {
    expect(frequencyKhzToMhz("14074.0")).toBeCloseTo(14.074, 6);
    expect(frequencyKhzToMhz("7225")).toBeCloseTo(7.225, 6);
    expect(frequencyKhzToMhz(14080)).toBeCloseTo(14.08, 6);
  });

  it("returns undefined for missing or non-numeric input", () => {
    expect(frequencyKhzToMhz(undefined)).toBeUndefined();
    expect(frequencyKhzToMhz(null)).toBeUndefined();
    expect(frequencyKhzToMhz("")).toBeUndefined();
    expect(frequencyKhzToMhz("abc")).toBeUndefined();
    expect(frequencyKhzToMhz(0)).toBeUndefined();
  });

  it("falls back to Hz for UHF frequencies logged in Hz", () => {
    // 436795000 is 436.795 MHz (70cm) submitted in Hz, not kHz.
    expect(frequencyKhzToMhz("436795000")).toBeCloseTo(436.795, 3);
    expect(frequencyKhzToMhz("146520000")).toBeCloseTo(146.52, 3);
  });

  it("drops values implausible in both kHz and Hz", () => {
    expect(frequencyKhzToMhz("50000000000")).toBeUndefined();
  });
});

describe("bandForMhz", () => {
  const cases: [mhz: number, band: string][] = [
    [14.074, "20m"],
    [7.225, "40m"],
    [3.573, "80m"],
    [21.074, "15m"],
    [28.074, "10m"],
    [50.313, "6m"],
    [146.52, "2m"],
    [446.0, "70cm"],
  ];
  it.each(cases)("%f MHz -> %s", (mhz, band) => {
    expect(bandForMhz(mhz)).toBe(band);
  });

  it("returns undefined outside known bands or for missing input", () => {
    expect(bandForMhz(13.0)).toBeUndefined();
    expect(bandForMhz(undefined)).toBeUndefined();
    expect(bandForMhz(null)).toBeUndefined();
  });
});
