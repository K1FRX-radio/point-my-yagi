import { type RepeaterBookDataset, type Target } from "@/domain";

import {
  authenticationError,
  networkError,
  parsingError,
  permissionError,
  rateLimitError,
  type SourceError,
  type SourceResult,
} from "../errors";
import type { FetchLike, FetchResponseLike } from "../http";
import { asArray, asRecord, SchemaError } from "../schema";
import { mapRepeaterBookRecords } from "./repeaterbook-mapping";

export const REPEATERBOOK_API_BASE = "https://www.repeaterbook.com/api";

// Identifies this app to RepeaterBook. The contact MUST be a real, reachable
// address before requesting API approval (a generic UA is rejected by policy).
export const REPEATERBOOK_USER_AGENT =
  "PointMyYagi/1.0 (+https://github.com/K1FRX-radio/point-my-yagi; k1frxradio@gmail.com)";

// Self-imposed controls promised in docs/repeaterbook-api-application.md. These
// are our commitments, not published RepeaterBook limits; if RepeaterBook issues
// explicit limits during approval, update both these values and the doc.
const CACHE_TTL_MS = 60_000;
const MIN_INTERVAL_MS = 1_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const BACKOFF_START_SEC = 2;
const BACKOFF_MAX_SEC = 60;

// RepeaterBook JSON error codes -> our typed categories.
function mapErrorCode(code: string | undefined, status: number): SourceError {
  switch (code) {
    case "rate_limited":
      return rateLimitError("RepeaterBook is rate limiting requests.");
    case "auth_scope_denied":
    case "ua_mismatch":
      return permissionError("This app is not approved for the requested RepeaterBook access.");
    case "auth_missing":
    case "auth_invalid":
    case "auth_inactive":
    case "auth_revoked":
      return authenticationError("Your RepeaterBook token is missing, invalid, or revoked.");
    default:
      if (status === 429) {
        return rateLimitError("RepeaterBook is rate limiting requests.");
      }
      return networkError(`RepeaterBook responded with status ${status}.`);
  }
}

export interface RepeaterBookLookup {
  /** Normalized single callsign (see normalizeCallsign). */
  callsign: string;
  dataset: RepeaterBookDataset;
  /** The current user's app-bound token (rbuapp_...). */
  token: string;
}

export interface RepeaterBookClientOptions {
  fetch?: FetchLike;
  /** Injectable clock (epoch ms). Defaults to Date.now. */
  now?: () => number;
  userAgent?: string;
  baseUrl?: string;
}

interface CacheEntry {
  value: readonly Target[];
  expiresAt: number;
}

/**
 * Long-lived coordinator for RepeaterBook lookups. Owns the session-wide cache,
 * concurrency, rate limiting, and 429 backoff so the controls hold no matter how
 * many short-lived {@link RepeaterBookTargetSource} instances are created (e.g.
 * resolveSavedTarget builds a new source per open).
 */
export class RepeaterBookClient {
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private readonly userAgent: string;
  private readonly baseUrl: string;

  private readonly cache = new Map<string, CacheEntry>();
  private inFlight = false;
  private lastStartedAt = Number.NEGATIVE_INFINITY;
  private windowStarts: number[] = [];
  private backoffUntil = 0;
  private backoffStepSec = BACKOFF_START_SEC;

  constructor(options: RepeaterBookClientOptions = {}) {
    this.fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.now = options.now ?? Date.now;
    this.userAgent = options.userAgent ?? REPEATERBOOK_USER_AGENT;
    this.baseUrl = options.baseUrl ?? REPEATERBOOK_API_BASE;
  }

  async lookup(req: RepeaterBookLookup): Promise<SourceResult<readonly Target[]>> {
    const now = this.now();
    // The dataset is part of the key so NA and ROW results never collide.
    const key = `${req.dataset}:${req.callsign}`;

    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      return { ok: true, value: cached.value };
    }

    if (this.inFlight) {
      return { ok: false, error: rateLimitError("A RepeaterBook lookup is already in progress.") };
    }
    if (now < this.backoffUntil) {
      return {
        ok: false,
        error: rateLimitError(
          "RepeaterBook is backing off after rate limiting. Try again shortly.",
        ),
      };
    }
    if (now - this.lastStartedAt < MIN_INTERVAL_MS) {
      return {
        ok: false,
        error: rateLimitError("Too many RepeaterBook lookups. Wait a second and try again."),
      };
    }
    this.pruneWindow(now);
    if (this.windowStarts.length >= RATE_MAX) {
      return {
        ok: false,
        error: rateLimitError("RepeaterBook lookup limit reached. Try again in a minute."),
      };
    }

    this.inFlight = true;
    this.lastStartedAt = now;
    this.windowStarts.push(now);
    try {
      const result = await this.performFetch(req);
      if (result.ok) {
        this.cache.set(key, { value: result.value, expiresAt: this.now() + CACHE_TTL_MS });
        // Successful traffic resets the backoff sequence.
        this.backoffStepSec = BACKOFF_START_SEC;
        this.backoffUntil = 0;
      } else if (result.error.category === "rateLimit") {
        // A 429 from RepeaterBook: schedule escalating backoff, never auto-retry.
        this.backoffUntil = this.now() + this.backoffStepSec * 1000;
        this.backoffStepSec = Math.min(this.backoffStepSec * 2, BACKOFF_MAX_SEC);
      }
      return result;
    } finally {
      this.inFlight = false;
    }
  }

  private pruneWindow(now: number): void {
    this.windowStarts = this.windowStarts.filter((t) => now - t < RATE_WINDOW_MS);
  }

  private async performFetch(req: RepeaterBookLookup): Promise<SourceResult<readonly Target[]>> {
    // North America uses export.php; the rest of the world uses exportROW.php.
    const endpoint = req.dataset === "row" ? "exportROW.php" : "export.php";
    const url = `${this.baseUrl}/${endpoint}?callsign=${encodeURIComponent(req.callsign)}`;

    let response: FetchResponseLike;
    try {
      response = await this.fetchImpl(url, {
        headers: {
          "X-RB-App-Token": req.token,
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
      });
    } catch (error) {
      return {
        ok: false,
        error: networkError("Could not reach RepeaterBook. Check your connection.", error),
      };
    }

    if (!response.ok) {
      let code: string | undefined;
      try {
        const body = asRecord(await response.json());
        code = typeof body.code === "string" ? body.code : undefined;
      } catch {
        code = undefined;
      }
      return { ok: false, error: mapErrorCode(code, response.status) };
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      return { ok: false, error: parsingError("RepeaterBook returned invalid JSON.", error) };
    }

    try {
      const root = asRecord(json, "response");
      const results = asArray(root.results ?? [], "response.results");
      return { ok: true, value: mapRepeaterBookRecords(results, req.dataset) };
    } catch (error) {
      if (error instanceof SchemaError) {
        return { ok: false, error: parsingError(error.message, error) };
      }
      throw error;
    }
  }
}

/** Process-wide client so every RepeaterBook source shares one throttle/cache gate. */
export const sharedRepeaterBookClient = new RepeaterBookClient();
