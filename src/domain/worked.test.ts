import { describe, expect, it } from "vitest";

import { utcDayKey, workedKey } from "./worked";

describe("workedKey", () => {
  it("normalizes case and whitespace", () => {
    expect(workedKey("ae0xj", "us-0370")).toBe("AE0XJ|US-0370");
    expect(workedKey("  NA7C ", " US-3094 ")).toBe("NA7C|US-3094");
  });

  it("distinguishes the same activator at different parks", () => {
    expect(workedKey("NA7C", "US-3094")).not.toBe(workedKey("NA7C", "US-0301"));
  });

  it("distinguishes different activators at the same park", () => {
    expect(workedKey("NA7C", "US-3094")).not.toBe(workedKey("AJ7GF", "US-3094"));
  });
});

describe("utcDayKey", () => {
  it("returns the UTC calendar day", () => {
    expect(utcDayKey(Date.parse("2026-09-15T21:45:48Z"))).toBe("2026-09-15");
    // Just before UTC midnight stays on the 15th regardless of local zone.
    expect(utcDayKey(Date.parse("2026-09-15T23:59:59Z"))).toBe("2026-09-15");
    expect(utcDayKey(Date.parse("2026-09-16T00:00:01Z"))).toBe("2026-09-16");
  });
});
