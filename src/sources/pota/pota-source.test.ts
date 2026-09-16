import { describe, expect, it, vi } from "vitest";

import { describeTargetSourceContract } from "../testing/target-source-contract";
import spots from "./__fixtures__/activator-spots.json";
import { PotaTargetSource, type FetchLike, type FetchResponseLike } from "./pota-source";

interface FakeFetchOptions {
  status?: number;
  throwError?: boolean;
  badJson?: boolean;
  body?: unknown;
}

function fakeFetch(options: FakeFetchOptions = {}) {
  const fn = vi.fn<FetchLike>(async (): Promise<FetchResponseLike> => {
    if (options.throwError) {
      throw new Error("network down");
    }
    return {
      ok: (options.status ?? 200) < 400,
      status: options.status ?? 200,
      json: async () => {
        if (options.badJson) {
          throw new Error("bad json");
        }
        return options.body ?? spots;
      },
    };
  });
  return fn;
}

describe("PotaTargetSource", () => {
  it("fetches and maps current spots", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch() });
    const result = await source.search();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(4);
      expect(result.value.every((t) => t.sourceType === "pota")).toBe(true);
    }
  });

  it("caches within the TTL and refetches after it expires", async () => {
    let clock = 1_000;
    const fetchImpl = fakeFetch();
    const source = new PotaTargetSource({
      fetch: fetchImpl,
      now: () => clock,
      cacheTtlMs: 60_000,
    });

    await source.search();
    await source.search();
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    clock += 60_001;
    await source.search();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("filters by mode", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch() });
    const result = await source.search({ mode: "ft8" });
    expect(result.ok && result.value.map((t) => t.callsign)).toEqual(["NA7C"]);
  });

  it("filters by band", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch() });
    const result = await source.search({ band: "20m" });
    expect(result.ok && result.value.map((t) => t.callsign).sort()).toEqual(["AE0XJ", "NA7C"]);
  });

  it("filters and sorts by distance from a point", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch() });
    const nearUtah = { latitude: 40.2378, longitude: -111.736 };
    const result = await source.search({ near: nearUtah, maxDistanceKm: 100 });
    expect(result.ok && result.value.map((t) => t.callsign)).toEqual(["NA7C"]);
  });

  it("limits results", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch() });
    const result = await source.search({ maxResults: 2 });
    expect(result.ok && result.value).toHaveLength(2);
  });

  it("returns a retriable network error when the request throws", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch({ throwError: true }) });
    const result = await source.search();
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ category: "network", retriable: true }),
    });
  });

  it("maps HTTP 429 to a rate-limit error", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch({ status: 429 }) });
    const result = await source.search();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("rateLimit");
  });

  it("maps other HTTP errors to network errors", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch({ status: 500 }) });
    const result = await source.search();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("network");
  });

  it("maps invalid JSON to a parsing error", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch({ badJson: true }) });
    const result = await source.search();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("parsing");
  });

  it("maps a non-array body to a parsing error", async () => {
    const source = new PotaTargetSource({ fetch: fakeFetch({ body: { not: "an array" } }) });
    const result = await source.search();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("parsing");
  });
});

describeTargetSourceContract("PotaTargetSource", {
  source: new PotaTargetSource({ fetch: fakeFetch() }),
  sampleSearch: { maxResults: 5 },
});
