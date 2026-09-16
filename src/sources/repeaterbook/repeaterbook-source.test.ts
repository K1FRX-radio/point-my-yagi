import { describe, expect, it, vi } from "vitest";

import type { FetchLike, FetchResponseLike } from "../http";
import { describeTargetSourceContract } from "../testing/target-source-contract";
import fixture from "./__fixtures__/export-records.json";
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

describe("RepeaterBookTargetSource (disabled)", () => {
  it("returns a permission error and does not fetch when the flag is off", async () => {
    const fetchImpl = fakeFetch();
    const source = new RepeaterBookTargetSource({
      enabled: false,
      token: "rbuapp_x",
      fetch: fetchImpl,
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
    const source = new RepeaterBookTargetSource({ enabled: true, fetch: fetchImpl });
    const result = await source.search({ text: "W6ABC" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("authentication");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("RepeaterBookTargetSource (enabled)", () => {
  function enabledSource(options: FakeFetchOptions = {}) {
    const fetchImpl = fakeFetch(options);
    const source = new RepeaterBookTargetSource({
      enabled: true,
      token: "rbuapp_test",
      userAgent: "PointMyYagi/test (+https://example.org; dev@example.org)",
      fetch: fetchImpl,
    });
    return { source, fetchImpl };
  }

  it("maps records and sends the required token and User-Agent headers", async () => {
    const { source, fetchImpl } = enabledSource();
    const result = await source.search({ text: "W6ABC" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((t) => t.callsign)).toEqual(["W6ABC", "K5XYZ"]);
    }
    const [, init] = fetchImpl.mock.calls[0];
    expect(init?.headers?.["X-RB-App-Token"]).toBe("rbuapp_test");
    expect(init?.headers?.["User-Agent"]).toContain("PointMyYagi/test");
  });

  it("maps HTTP 429 to a rate-limit error", async () => {
    const { source } = enabledSource({ status: 429, body: { code: "rate_limited" } });
    const result = await source.search({ text: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("rateLimit");
  });

  it("maps an auth error code to an authentication error", async () => {
    const { source } = enabledSource({ status: 401, body: { code: "auth_invalid" } });
    const result = await source.search({ text: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("authentication");
  });

  it("maps a scope/User-Agent denial to a permission error", async () => {
    const { source } = enabledSource({ status: 403, body: { code: "ua_mismatch" } });
    const result = await source.search({ text: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("permission");
  });

  it("returns a network error when the request throws", async () => {
    const { source } = enabledSource({ throwError: true });
    const result = await source.search({ text: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("network");
  });
});

describeTargetSourceContract("RepeaterBookTargetSource", {
  source: new RepeaterBookTargetSource({
    enabled: true,
    token: "rbuapp_test",
    fetch: fakeFetch(),
  }),
  sampleSearch: { text: "W6ABC" },
});
