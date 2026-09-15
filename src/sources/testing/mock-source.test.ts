import { describe, expect, it } from "vitest";

import { MockTargetSource } from "./mock-source";
import { describeTargetSourceContract } from "./target-source-contract";

describe("MockTargetSource error paths", () => {
  const source = new MockTargetSource();

  it("surfaces a retriable network error", async () => {
    const result = await source.search({ text: "fail:network" });
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ category: "network", retriable: true }),
    });
  });

  it("returns an unavailable error for an unknown id", async () => {
    const result = await source.lookup({ id: "missing" });
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ category: "unavailable" }),
    });
  });

  it("filters search results by text", async () => {
    const result = await source.search({ text: "north" });
    expect(result.ok && result.value.map((t) => t.id)).toEqual(["mock:1"]);
  });
});

describeTargetSourceContract("MockTargetSource", {
  source: new MockTargetSource(),
  sampleSearch: { text: "mock" },
  sampleLookup: { id: "mock:1" },
});
