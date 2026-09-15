import { describe, expect, it } from "vitest";

import {
    parseLatitude,
    parseLongitude,
    validateLatitude,
    validateLongitude,
} from "./coordinates";

describe("validateLatitude", () => {
  const cases: [value: number, expected: boolean][] = [
    [0, true],
    [90, true],
    [-90, true],
    [45.123, true],
    [90.0001, false],
    [-90.0001, false],
    [Number.NaN, false],
    [Number.POSITIVE_INFINITY, false],
  ];
  it.each(cases)("validateLatitude(%f) -> %s", (value, expected) => {
    expect(validateLatitude(value)).toBe(expected);
  });
});

describe("validateLongitude", () => {
  const cases: [value: number, expected: boolean][] = [
    [0, true],
    [180, true],
    [-180, true],
    [180.0001, false],
    [-180.0001, false],
    [Number.NaN, false],
  ];
  it.each(cases)("validateLongitude(%f) -> %s", (value, expected) => {
    expect(validateLongitude(value)).toBe(expected);
  });
});

describe("parseLatitude", () => {
  it("parses a valid value", () => {
    expect(parseLatitude("41.7")).toEqual({ ok: true, value: 41.7 });
  });
  it("trims surrounding whitespace", () => {
    expect(parseLatitude("  -12.5 ")).toEqual({ ok: true, value: -12.5 });
  });
  it("rejects empty input", () => {
    expect(parseLatitude("   ")).toEqual({
      ok: false,
      error: expect.stringMatching(/required/),
    });
  });
  it("rejects non-numeric input", () => {
    expect(parseLatitude("12abc")).toEqual({
      ok: false,
      error: expect.stringMatching(/number/),
    });
  });
  it("rejects out-of-range input", () => {
    expect(parseLatitude("91")).toEqual({
      ok: false,
      error: expect.stringMatching(/between/),
    });
  });
});

describe("parseLongitude", () => {
  it("parses a valid value", () => {
    expect(parseLongitude("-72.71")).toEqual({ ok: true, value: -72.71 });
  });
  it("rejects out-of-range input", () => {
    expect(parseLongitude("181")).toEqual({
      ok: false,
      error: expect.stringMatching(/between/),
    });
  });
});
