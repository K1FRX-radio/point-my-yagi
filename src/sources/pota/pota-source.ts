import { type Target } from "@/domain";

import { networkError, parsingError, rateLimitError, type SourceResult } from "../errors";
import { filterTargets } from "../filter-targets";
import { asArray, SchemaError } from "../schema";
import type { SearchRequest, TargetSource, TargetSourceInfo } from "../target-source";
import { mapPotaSpots } from "./pota-mapping";

export const POTA_ACTIVATOR_ENDPOINT = "https://api.pota.app/spot/activator";

/** Minimal structural subset of the fetch Response we depend on (for injection). */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<FetchResponseLike>;

export interface PotaSourceOptions {
  /** Injectable fetch, for tests. Defaults to the global fetch. */
  fetch?: FetchLike;
  /** Injectable clock (epoch ms), for tests. */
  now?: () => number;
  /** In-memory cache lifetime; guards against rapid polling. Default 60s. */
  cacheTtlMs?: number;
}

/**
 * Read-only POTA activator-spots adapter. Experimental: not for production until
 * POTA usage permission is documented. Fetches only when asked, caches briefly
 * in memory, and never claims to know the activator's exact position.
 */
export class PotaTargetSource implements TargetSource {
  readonly info: TargetSourceInfo = {
    id: "pota",
    label: "POTA",
    sourceType: "pota",
    attribution: "Spots courtesy of POTA (pota.app)",
    attributionUrl: "https://pota.app",
    experimental: true,
  };

  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private readonly cacheTtlMs: number;
  private cache?: { at: number; targets: Target[] };

  constructor(options: PotaSourceOptions = {}) {
    this.fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.now = options.now ?? (() => Date.now());
    this.cacheTtlMs = options.cacheTtlMs ?? 60_000;
  }

  async search(request: SearchRequest = {}): Promise<SourceResult<readonly Target[]>> {
    const loaded = await this.load();
    if (!loaded.ok) {
      return loaded;
    }
    return { ok: true, value: filterTargets(loaded.value, request) };
  }

  private async load(): Promise<SourceResult<Target[]>> {
    const now = this.now();
    if (this.cache && now - this.cache.at <= this.cacheTtlMs) {
      return { ok: true, value: this.cache.targets };
    }
    const fetched = await this.fetchSpots();
    if (fetched.ok) {
      this.cache = { at: now, targets: fetched.value };
    }
    return fetched;
  }

  private async fetchSpots(): Promise<SourceResult<Target[]>> {
    let response: FetchResponseLike;
    try {
      response = await this.fetchImpl(POTA_ACTIVATOR_ENDPOINT, {
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      return {
        ok: false,
        error: networkError("Could not reach POTA. Check your connection.", error),
      };
    }

    if (!response.ok) {
      if (response.status === 429) {
        return {
          ok: false,
          error: rateLimitError("POTA is rate limiting requests. Try again shortly."),
        };
      }
      return { ok: false, error: networkError(`POTA responded with status ${response.status}.`) };
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      return { ok: false, error: parsingError("POTA returned invalid JSON.", error) };
    }

    try {
      return { ok: true, value: mapPotaSpots(asArray(json, "spots")) };
    } catch (error) {
      if (error instanceof SchemaError) {
        return { ok: false, error: parsingError(error.message, error) };
      }
      throw error;
    }
  }
}
