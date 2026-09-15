import { describe, expect, it } from "vitest";

import { canCreate, canLookup, canSearch } from "../target-source";
import { describeTargetSourceContract } from "../testing/target-source-contract";
import { ManualTargetSource } from "./manual-source";

describe("ManualTargetSource", () => {
  const source = new ManualTargetSource();

  it("creates a target from valid coordinates", () => {
    const result = source.create({
      input: { kind: "coordinates", latitude: "41.7", longitude: "-72.7" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sourceType).toBe("manual");
      expect(result.value.precision).toBe("high");
    }
  });

  it("returns a parsing error for invalid input", () => {
    const result = source.create({
      input: { kind: "coordinates", latitude: "999", longitude: "0" },
    });
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ category: "parsing", retriable: false }),
    });
  });

  it("advertises only the create capability", () => {
    expect(canCreate(source)).toBe(true);
    expect(canSearch(source)).toBe(false);
    expect(canLookup(source)).toBe(false);
  });
});

describeTargetSourceContract("ManualTargetSource", {
  source: new ManualTargetSource(),
  sampleCreate: { input: { kind: "grid", grid: "FN31pr" } },
});
