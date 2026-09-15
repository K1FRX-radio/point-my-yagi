import { describe, expect, it } from "vitest";

import { ManualTargetSource } from "./manual/manual-source";
import { TargetSourceRegistry } from "./registry";
import { MockTargetSource } from "./testing/mock-source";

function makeRegistry() {
  return new TargetSourceRegistry()
    .register(new ManualTargetSource())
    .register(new MockTargetSource());
}

describe("TargetSourceRegistry", () => {
  it("registers and retrieves sources by id", () => {
    const registry = makeRegistry();
    expect(registry.get("manual")?.info.label).toBe("Manual");
    expect(registry.get("mock")?.info.label).toBe("Mock");
    expect(registry.get("nope")).toBeUndefined();
    expect(registry.list()).toHaveLength(2);
  });

  it("rejects duplicate ids", () => {
    const registry = makeRegistry();
    expect(() => registry.register(new ManualTargetSource())).toThrow(/already registered/);
  });

  it("filters sources by capability", () => {
    const registry = makeRegistry();
    expect(registry.creatable().map((s) => s.info.id)).toEqual(["manual"]);
    expect(registry.searchable().map((s) => s.info.id)).toEqual(["mock"]);
    expect(registry.lookupable().map((s) => s.info.id)).toEqual(["mock"]);
  });
});
