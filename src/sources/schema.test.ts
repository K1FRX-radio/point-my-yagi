import { describe, expect, it } from "vitest";

import {
  asArray,
  asRecord,
  getNumber,
  getOptionalNumber,
  getOptionalNumberLike,
  getOptionalString,
  getString,
  parseRemote,
  SchemaError,
} from "./schema";

describe("schema extractors", () => {
  it("asRecord accepts objects and rejects others", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(() => asRecord([])).toThrow(SchemaError);
    expect(() => asRecord(null)).toThrow(SchemaError);
    expect(() => asRecord("x")).toThrow(SchemaError);
  });

  it("asArray accepts arrays and rejects others", () => {
    expect(asArray([1, 2])).toEqual([1, 2]);
    expect(() => asArray({})).toThrow(SchemaError);
  });

  it("getString / getOptionalString", () => {
    const obj = { name: "W1ABC", note: undefined };
    expect(getString(obj, "name")).toBe("W1ABC");
    expect(() => getString(obj, "missing")).toThrow(SchemaError);
    expect(getOptionalString(obj, "note")).toBeUndefined();
    expect(getOptionalString(obj, "name")).toBe("W1ABC");
  });

  it("getNumber / getOptionalNumber reject non-finite", () => {
    const obj = { lat: 41.7, bad: Number.NaN };
    expect(getNumber(obj, "lat")).toBe(41.7);
    expect(() => getNumber(obj, "bad")).toThrow(SchemaError);
    expect(getOptionalNumber(obj, "missing")).toBeUndefined();
  });

  it("getOptionalNumberLike coerces numeric strings", () => {
    const obj = { freq: "14074", empty: "", real: 7 };
    expect(getOptionalNumberLike(obj, "freq")).toBe(14074);
    expect(getOptionalNumberLike(obj, "empty")).toBeUndefined();
    expect(getOptionalNumberLike(obj, "missing")).toBeUndefined();
    expect(getOptionalNumberLike(obj, "real")).toBe(7);
    expect(() => getOptionalNumberLike({ x: "abc" }, "x")).toThrow(SchemaError);
  });
});

describe("parseRemote", () => {
  it("returns ok for successful parses", () => {
    expect(parseRemote(() => 42)).toEqual({ ok: true, value: 42 });
  });

  it("maps SchemaError to a parsing SourceError", () => {
    const result = parseRemote(() => {
      throw new SchemaError("bad field");
    });
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ category: "parsing", retriable: false }),
    });
  });

  it("rethrows non-schema errors", () => {
    expect(() =>
      parseRemote(() => {
        throw new TypeError("unexpected");
      }),
    ).toThrow(TypeError);
  });
});
