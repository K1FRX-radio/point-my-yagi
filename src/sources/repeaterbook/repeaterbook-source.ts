import { type RepeaterBookDataset, type Target } from "@/domain";

import { featureFlags } from "@/config/feature-flags";
import { authenticationError, permissionError, type SourceResult } from "../errors";
import { filterTargets } from "../filter-targets";
import type { SearchRequest, TargetSource, TargetSourceInfo } from "../target-source";
import { normalizeCallsign } from "./callsign";
import {
  RepeaterBookClient,
  REPEATERBOOK_API_BASE,
  REPEATERBOOK_USER_AGENT,
  sharedRepeaterBookClient,
} from "./repeaterbook-client";

export { REPEATERBOOK_API_BASE, REPEATERBOOK_USER_AGENT };

export interface RepeaterBookSourceOptions {
  /** Whether live calls are allowed. Defaults to the RepeaterBook feature flag. */
  enabled?: boolean;
  /** The current user's app-bound RepeaterBook token (rbuapp_...). */
  token?: string;
  /** Which export dataset to query: North America (default) or rest-of-world. */
  dataset?: RepeaterBookDataset;
  /**
   * The shared request coordinator that owns cache/throttle/backoff. Defaults to
   * the process-wide client so limits hold across all source instances; override
   * only in tests (with an injected clock/fetch).
   */
  client?: RepeaterBookClient;
}

/**
 * RepeaterBook Export API adapter, gated behind the RepeaterBook feature flag.
 * While disabled (the default until RepeaterBook approves the application) it
 * performs no network requests and returns a pending-approval permission error.
 *
 * Enforces a targeted single-callsign lookup at the boundary and delegates all
 * network access to a shared {@link RepeaterBookClient} that owns the cache,
 * concurrency, rate limiting, and 429 backoff. See docs/data-source-policy.md
 * and docs/repeaterbook-api-application.md.
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
  private readonly dataset: RepeaterBookDataset;
  private readonly client: RepeaterBookClient;

  constructor(options: RepeaterBookSourceOptions = {}) {
    this.enabled = options.enabled ?? featureFlags.repeaterBook;
    this.token = options.token;
    this.dataset = options.dataset ?? "na";
    this.client = options.client ?? sharedRepeaterBookClient;
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

    // Enforce the "one targeted lookup" promise before any network call: reject
    // empty input, the `%` wildcard, and other non-callsign query forms.
    const callsign = normalizeCallsign(request.text);
    if (callsign === null) {
      return {
        ok: false,
        error: permissionError("Enter a single repeater callsign to look up on RepeaterBook."),
      };
    }

    const result = await this.client.lookup({ callsign, dataset: this.dataset, token: this.token });
    if (!result.ok) {
      return result;
    }
    // The callsign drove the server query, so no band/mode/region browse filters
    // here. Keep optional nearest-first sorting and a small disambiguation cap.
    return {
      ok: true,
      value: filterTargets(result.value, {
        near: request.near,
        maxResults: request.maxResults ?? 25,
      }),
    };
  }
}
