import { describe, expect, it } from "vitest";

import { formatDistance } from "./units";

describe("formatDistance (metric)", () => {
  it("shows meters below 1 km and km above", () => {
    expect(formatDistance(450, "metric")).toBe("450 m");
    expect(formatDistance(3400, "metric")).toBe("3.4 km");
    expect(formatDistance(34400, "metric")).toBe("34 km");
  });
});

describe("formatDistance (imperial)", () => {
  it("shows feet for very short and miles otherwise", () => {
    expect(formatDistance(120, "imperial")).toBe("394 ft");
    expect(formatDistance(3400, "imperial")).toBe("2.1 mi");
    expect(formatDistance(34400, "imperial")).toBe("21 mi");
  });
});

describe("formatDistance (edge cases)", () => {
  it("returns a dash for invalid input", () => {
    expect(formatDistance(Number.NaN, "metric")).toBe("—");
    expect(formatDistance(-1, "imperial")).toBe("—");
  });
});
