import { describe, expect, it, vi } from "vitest";

import type { FetchLike, FetchResponseLike } from "../http";
import { describeTargetSourceContract } from "../testing/target-source-contract";
import fixture from "./__fixtures__/export-records.json";
import { RepeaterBookClient } from "./repeaterbook-client";
import { RepeaterBookTargetSource } from "./repeaterbook-source";

interface FakeFetchOptions {
  status?: number;
  body?: unknown;
  throwError?: boolean;
}

function fakeFetch(options: FakeFetchOptions = {}) {
  return vi.fn<FetchLike>(async (): Promise<FetchResponseLike> => {
    if (options.throwError) {
      throw new Error("offline");
    }
    return {
      ok: (options.status ?? 200) < 400,
      status: options.status ?? 200,
      json: async () => options.body ?? fixture,
    };
  });
}

function makeClient(fetchImpl: FetchLike) {
  return new RepeaterBookClient({
    fetch: fetchImpl,
    now: () => Date.now(),
    schedule: () => {},
    userAgent: "PointMyYagi/test",
    baseUrl: "https://rb.test/api",
  });
}

describe("RepeaterBookTargetSource (disabled)", () => {
  it("returns a permission error and does not fetch when the flag is off", async () => {
    const fetchImpl = fakeFetch();
    const source = new RepeaterBookTargetSource({
      enabled: false,
      token: "rbuapp_x",
      client: makeClient(fetchImpl),
    });
    const result = await source.search({ text: "W6ABC" });
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ category: "permission" }),
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires a token even when enabled, without fetching", async () => {
    const fetchImpl = fakeFetch();
    const source = new RepeaterBookTargetSource({ enabled: true, client: makeClient(fetchImpl) });
    const result = await source.search({ text: "W6ABC" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("authentication");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("RepeaterBookTargetSource input validation", () => {
  function enabledSource(options: FakeFetchOptions = {}) {
    const fetchImpl = fakeFetch(options);
    const source = new RepeaterBookTargetSource({
      enabled: true,
      token: "rbuapp_test",
      client: makeClient(fetchImpl),
    });
    return { source, fetchImpl };
  }

  it("rejects an empty callsign without fetching", async () => {
    const { source, fetchImpl } = enabledSource();
    const result = await source.search({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("permission");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects the RepeaterBook % wildcard without fetching", async () => {
    const { source, fetchImpl } = enabledSource();
    const result = await source.search({ text: "%" });
    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a partial-wildcard query without fetching", async () => {
    const { source, fetchImpl } = enabledSource();
    const result = await source.search({ text: "W6%" });
    expect(result.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("RepeaterBookTargetSource (enabled)", () => {
  function enabledSource(options: FakeFetchOptions = {}, dataset?: "na" | "row") {
    const fetchImpl = fakeFetch(options);
    const source = new RepeaterBookTargetSource({
      enabled: true,
      token: "rbuapp_test",
      dataset,
      client: makeClient(fetchImpl),
    });
    return { source, fetchImpl };
  }

  it("maps records for a targeted callsign lookup", async () => {
    const { source } = enabledSource();
    const result = await source.search({ text: "W6ABC" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((t) => t.callsign)).toEqual(["W6ABC", "K5XYZ"]);
    }
  });

  it("ignores band/mode/region browse filters (targeted callsign lookup only)", async () => {
    const { source } = enabledSource();
    const result = await source.search({ text: "W6ABC", mode: "SSB", band: "70cm", region: "ZZ" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((t) => t.callsign)).toEqual(["W6ABC", "K5XYZ"]);
    }
  });

  it("caps results to the requested maximum", async () => {
    const { source } = enabledSource();
    const result = await source.search({ text: "W6ABC", maxResults: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it("routes a rest-of-world dataset to exportROW.php", async () => {
    const { source, fetchImpl } = enabledSource({}, "row");
    await source.search({ text: "G0ABC" });
    const [url] = fetchImpl.mock.calls[0];
    expect(url).toContain("/exportROW.php?callsign=G0ABC");
  });
});

describeTargetSourceContract("RepeaterBookTargetSource", {
  source: new RepeaterBookTargetSource({
    enabled: true,
    token: "rbuapp_test",
    client: makeClient(fakeFetch()),
  }),
  sampleSearch: { text: "W6ABC" },
});
