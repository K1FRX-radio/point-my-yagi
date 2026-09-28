import { describe, expect, it } from "vitest";

import { normalizeCallsign } from "./callsign";

describe("normalizeCallsign", () => {
  it("trims and upper-cases a valid callsign", () => {
    expect(normalizeCallsign("  w6abc  ")).toBe("W6ABC");
    expect(normalizeCallsign("K5XYZ")).toBe("K5XYZ");
  });

  it("accepts portable/regional slash forms", () => {
    expect(normalizeCallsign("W1AW/4")).toBe("W1AW/4");
    expect(normalizeCallsign("PA/W1AW")).toBe("PA/W1AW");
    expect(normalizeCallsign("W1AW/P")).toBe("W1AW/P");
  });

  it("rejects empty or whitespace input", () => {
    expect(normalizeCallsign(undefined)).toBeNull();
    expect(normalizeCallsign("")).toBeNull();
    expect(normalizeCallsign("   ")).toBeNull();
  });

  it("rejects the RepeaterBook % wildcard and other broadening forms", () => {
    expect(normalizeCallsign("%")).toBeNull();
    expect(normalizeCallsign("W6%")).toBeNull();
    expect(normalizeCallsign("*")).toBeNull();
    expect(normalizeCallsign("W6 ABC")).toBeNull();
    expect(normalizeCallsign("W6,K5")).toBeNull();
  });

  it("rejects all-letter or all-digit noise", () => {
    expect(normalizeCallsign("ABC")).toBeNull();
    expect(normalizeCallsign("12345")).toBeNull();
  });
});
