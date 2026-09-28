import { describe, expect, it, vi } from "vitest";

import type { FetchLike, FetchResponseLike } from "../http";
import fixture from "./__fixtures__/export-records.json";
import { RepeaterBookClient, type RepeaterBookLookup } from "./repeaterbook-client";

function makeClock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

type ScriptEntry = { status?: number; body?: unknown } | "throw";

function scriptFetch(responses: ScriptEntry[] = [{}]) {
  let i = 0;
  return vi.fn<FetchLike>(async (): Promise<FetchResponseLike> => {
    const r = responses[Math.min(i, responses.length - 1)];
    i += 1;
    if (r === "throw") {
      throw new Error("offline");
    }
    return {
      ok: (r.status ?? 200) < 400,
      status: r.status ?? 200,
      json: async () => r.body ?? fixture,
    };
  });
}

function makeClient(
  fetchImpl: FetchLike,
  now: () => number,
  schedule?: (cb: () => void, ms: number) => void,
) {
  return new RepeaterBookClient({
    fetch: fetchImpl,
    now,
    schedule: schedule ?? (() => {}),
    userAgent: "PointMyYagi/test",
    baseUrl: "https://rb.test/api",
  });
}

function captureScheduler() {
  const tasks: { cb: () => void; ms: number }[] = [];
  return {
    schedule: (cb: () => void, ms: number) => {
      tasks.push({ cb, ms });
    },
    tasks,
  };
}

const na = (callsign: string): RepeaterBookLookup => ({
  callsign,
  dataset: "na",
  token: "rbuapp_x",
});
const row = (callsign: string): RepeaterBookLookup => ({
  callsign,
  dataset: "row",
  token: "rbuapp_x",
});

describe("RepeaterBookClient endpoint routing", () => {
  it("uses export.php for North America and sends the token + User-Agent", async () => {
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, makeClock().now);
    await client.lookup(na("W6ABC"));

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://rb.test/api/export.php?callsign=W6ABC");
    expect(init?.headers?.["X-RB-App-Token"]).toBe("rbuapp_x");
    expect(init?.headers?.["User-Agent"]).toBe("PointMyYagi/test");
  });

  it("uses exportROW.php for the rest of the world", async () => {
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, makeClock().now);
    await client.lookup(row("G0ABC"));

    const [url] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://rb.test/api/exportROW.php?callsign=G0ABC");
  });

  it("stamps the dataset on mapped targets", async () => {
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, makeClock().now);
    const result = await client.lookup(row("G0ABC"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.every((t) => t.repeaterBookDataset === "row")).toBe(true);
    }
  });
});

describe("RepeaterBookClient cache", () => {
  it("serves an identical lookup from cache within 60s (one fetch)", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, clock.now);

    await client.lookup(na("W6ABC"));
    clock.advance(30_000);
    await client.lookup(na("W6ABC"));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("refetches after the 60s cache TTL expires", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, clock.now);

    await client.lookup(na("W6ABC"));
    clock.advance(60_001);
    await client.lookup(na("W6ABC"));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("keys the cache by dataset so NA and ROW never collide", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, clock.now);

    await client.lookup(na("W6ABC"));
    clock.advance(1_000);
    await client.lookup(row("W6ABC"));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("evicts a cached entry when its scheduled TTL fires (removed from the Map)", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch();
    const scheduler = captureScheduler();
    const client = makeClient(fetchImpl, clock.now, scheduler.schedule);

    await client.lookup(na("W6ABC"));
    expect(scheduler.tasks[0]?.ms).toBe(60_000);

    // Fire the eviction while still inside the TTL window; the entry is gone, so
    // the next lookup refetches instead of serving a stale cache hit.
    scheduler.tasks[0]?.cb();
    clock.advance(2_000);
    await client.lookup(na("W6ABC"));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not evict a newer refetch when a stale eviction timer fires", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch();
    const scheduler = captureScheduler();
    const client = makeClient(fetchImpl, clock.now, scheduler.schedule);

    await client.lookup(na("W6ABC")); // cached, eviction task[0]
    clock.advance(60_001);
    await client.lookup(na("W6ABC")); // TTL expired -> refetch, eviction task[1]
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    // The stale timer must not delete the newer entry.
    scheduler.tasks[0]?.cb();
    clock.advance(2_000);
    await client.lookup(na("W6ABC"));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("RepeaterBookClient rate controls", () => {
  it("allows at most one in-flight request (no overlapping outbound calls)", async () => {
    const clock = makeClock();
    let resolveGate: () => void = () => {};
    const gate = new Promise<void>((r) => (resolveGate = r));
    const fetchImpl = vi.fn<FetchLike>(async (): Promise<FetchResponseLike> => {
      await gate;
      return { ok: true, status: 200, json: async () => fixture };
    });
    const client = makeClient(fetchImpl, clock.now);

    const first = client.lookup(na("W6ABC"));
    const second = await client.lookup(na("K5XYZ"));

    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.category).toBe("rateLimit");
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    resolveGate();
    expect((await first).ok).toBe(true);
  });

  it("enforces a 1-second minimum between outbound lookups", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, clock.now);

    await client.lookup(na("W6ABC"));
    const blocked = await client.lookup(na("K5XYZ"));
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.category).toBe("rateLimit");
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    clock.advance(1_000);
    await client.lookup(na("K5XYZ"));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("enforces a rolling ceiling of 20 lookups per minute", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch();
    const client = makeClient(fetchImpl, clock.now);

    for (let i = 0; i < 20; i += 1) {
      const r = await client.lookup(na(`W${i}ABC`));
      expect(r.ok).toBe(true);
      clock.advance(1_000);
    }
    const blocked = await client.lookup(na("K5XYZ"));
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.category).toBe("rateLimit");
    expect(fetchImpl).toHaveBeenCalledTimes(20);
  });
});

describe("RepeaterBookClient 429 backoff", () => {
  it("does not auto-retry a 429 and escalates backoff 2s -> 4s -> ... -> 60s cap", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch([{ status: 429, body: { code: "rate_limited" } }]);
    const client = makeClient(fetchImpl, clock.now);

    const expectedBackoffs = [2, 4, 8, 16, 32, 60, 60];
    for (const seconds of expectedBackoffs) {
      const before = fetchImpl.mock.calls.length;
      const hit = await client.lookup(na("W6ABC"));
      expect(hit.ok).toBe(false);
      if (!hit.ok) expect(hit.error.category).toBe("rateLimit");
      expect(fetchImpl.mock.calls.length).toBe(before + 1);

      // Just before the backoff elapses, a new lookup is blocked with no fetch.
      clock.advance(seconds * 1000 - 1);
      const blockedCount = fetchImpl.mock.calls.length;
      const blocked = await client.lookup(na("K5XYZ"));
      expect(blocked.ok).toBe(false);
      expect(fetchImpl.mock.calls.length).toBe(blockedCount);

      clock.advance(1);
    }
  });

  it("resets the backoff sequence after a successful lookup", async () => {
    const clock = makeClock();
    const fetchImpl = scriptFetch([
      { status: 429, body: { code: "rate_limited" } },
      {}, // success (fixture)
      { status: 429, body: { code: "rate_limited" } },
    ]);
    const client = makeClient(fetchImpl, clock.now);

    await client.lookup(na("W6ABC")); // 429 -> backoff 2s
    clock.advance(2_000);
    const ok = await client.lookup(na("K5XYZ")); // success -> reset
    expect(ok.ok).toBe(true);

    clock.advance(1_000);
    await client.lookup(na("W0XYZ")); // 429 again -> backoff should be 2s, not escalated
    // Blocked at +1999ms, allowed at +2000ms confirms the reset to 2s.
    clock.advance(1_999);
    const before = fetchImpl.mock.calls.length;
    const blocked = await client.lookup(na("W0AAA"));
    expect(blocked.ok).toBe(false);
    expect(fetchImpl.mock.calls.length).toBe(before);

    clock.advance(1);
    await client.lookup(na("W0AAA"));
    expect(fetchImpl.mock.calls.length).toBe(before + 1);
  });
});

describe("RepeaterBookClient error mapping", () => {
  it("maps an auth error code to authentication without retrying", async () => {
    const fetchImpl = scriptFetch([{ status: 401, body: { code: "auth_invalid" } }]);
    const client = makeClient(fetchImpl, makeClock().now);
    const result = await client.lookup(na("W6ABC"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("authentication");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("maps a scope/User-Agent denial to permission", async () => {
    const fetchImpl = scriptFetch([{ status: 403, body: { code: "ua_mismatch" } }]);
    const client = makeClient(fetchImpl, makeClock().now);
    const result = await client.lookup(na("W6ABC"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("permission");
  });

  it("returns a network error when the request throws", async () => {
    const fetchImpl = scriptFetch(["throw"]);
    const client = makeClient(fetchImpl, makeClock().now);
    const result = await client.lookup(na("W6ABC"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("network");
  });

  it("returns a parsing error for invalid JSON", async () => {
    const clock = makeClock();
    const fetchImpl = vi.fn<FetchLike>(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("bad json");
      },
    }));
    const client = makeClient(fetchImpl, clock.now);
    const result = await client.lookup(na("W6ABC"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.category).toBe("parsing");
  });
});
