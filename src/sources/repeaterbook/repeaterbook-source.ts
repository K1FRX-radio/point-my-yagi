import { type Target } from "@/domain";

import { featureFlags } from "@/config/feature-flags";
import {
  authenticationError,
  networkError,
  parsingError,
  permissionError,
  rateLimitError,
  type SourceResult,
} from "../errors";
import { filterTargets } from "../filter-targets";
import type { FetchLike, FetchResponseLike } from "../http";
import { asArray, asRecord, SchemaError } from "../schema";
import type { SearchRequest, TargetSource, TargetSourceInfo } from "../target-source";
import { mapRepeaterBookRecords } from "./repeaterbook-mapping";

export const REPEATERBOOK_API_BASE = "https://www.repeaterbook.com/api";

// Identifies this app to RepeaterBook. The contact MUST be a real, reachable
// address before requesting API approval (a generic UA is rejected by policy).
export const REPEATERBOOK_USER_AGENT =
  "PointMyYagi/0.1 (+https://github.com/K1FRX-radio/point-my-yagi; contact@example.invalid)";

// RepeaterBook JSON error codes -> our typed categories.
function mapErrorCode(code: string | undefined, status: number): SourceResult<never> {
  switch (code) {
    case "rate_limited":
      return { ok: false, error: rateLimitError("RepeaterBook is rate limiting requests.") };
    case "auth_scope_denied":
    case "ua_mismatch":
      return {
        ok: false,
        error: permissionError("This app is not approved for the requested RepeaterBook access."),
      };
    case "auth_missing":
    case "auth_invalid":
    case "auth_inactive":
    case "auth_revoked":
      return {
        ok: false,
        error: authenticationError("Your RepeaterBook token is missing, invalid, or revoked."),
      };
    default:
      if (status === 429) {
        return { ok: false, error: rateLimitError("RepeaterBook is rate limiting requests.") };
      }
      return {
        ok: false,
        error: networkError(`RepeaterBook responded with status ${status}.`),
      };
  }
}

export interface RepeaterBookSourceOptions {
  /** Whether live calls are allowed. Defaults to the RepeaterBook feature flag. */
  enabled?: boolean;
  /** The current user's app-bound RepeaterBook token (rbuapp_...). */
  token?: string;
  /** Overrides the application User-Agent. */
  userAgent?: string;
  /** Injectable fetch, for tests. Defaults to the global fetch. */
  fetch?: FetchLike;
  /** Overrides the API base URL, for tests. */
  baseUrl?: string;
}

/**
 * RepeaterBook Export API adapter, gated behind the RepeaterBook feature flag.
 * While disabled (the default until RepeaterBook approves the application) it
 * performs no network requests and returns a pending-approval permission error.
 * See docs/data-source-policy.md.
 */
export class RepeaterBookTargetSource implements TargetSource {
  readonly info: TargetSourceInfo = {
    id: "repeaterbook",
    label: "RepeaterBook",
    sourceType: "repeaterbook",
    attribution: "Data courtesy of RepeaterBook.com",
    attributionUrl: "https://www.repeaterbook.com",
    experimental: true,
  };

  private readonly enabled: boolean;
  private readonly token?: string;
  private readonly userAgent: string;
  private readonly fetchImpl: FetchLike;
  private readonly baseUrl: string;

  constructor(options: RepeaterBookSourceOptions = {}) {
    this.enabled = options.enabled ?? featureFlags.repeaterBook;
    this.token = options.token;
    this.userAgent = options.userAgent ?? REPEATERBOOK_USER_AGENT;
    this.fetchImpl = options.fetch ?? (globalThis.fetch as unknown as FetchLike);
    this.baseUrl = options.baseUrl ?? REPEATERBOOK_API_BASE;
  }

  async search(request: SearchRequest = {}): Promise<SourceResult<readonly Target[]>> {
    if (!this.enabled) {
      return {
        ok: false,
        error: permissionError("RepeaterBook is pending approval and disabled in this build."),
      };
    }
    if (!this.token) {
      return {
        ok: false,
        error: authenticationError("Add your RepeaterBook token to use this source."),
      };
    }

    const url = `${this.baseUrl}/export.php?callsign=${encodeURIComponent(request.text ?? "")}`;
    let response: FetchResponseLike;
    try {
      response = await this.fetchImpl(url, {
        headers: {
          "X-RB-App-Token": this.token,
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
      return mapErrorCode(code, response.status);
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
      const targets = mapRepeaterBookRecords(results);
      // `text` drove the server-side callsign query; don't re-filter on it here.
      return { ok: true, value: filterTargets(targets, { ...request, text: undefined }) };
    } catch (error) {
      if (error instanceof SchemaError) {
        return { ok: false, error: parsingError(error.message, error) };
      }
      throw error;
    }
  }
}
