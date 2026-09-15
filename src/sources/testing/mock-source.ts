import type { Target } from "@/domain";

import { networkError, unavailableError, type SourceResult } from "../errors";
import type {
  LookupRequest,
  SearchRequest,
  TargetSource,
  TargetSourceInfo,
} from "../target-source";

/** Fixture targets returned by {@link MockTargetSource}. */
export const MOCK_TARGETS: Target[] = [
  {
    id: "mock:1",
    name: "Mock Repeater North",
    latitude: 42.0,
    longitude: -71.0,
    sourceType: "repeaterbook",
    sourceLabel: "Mock",
    precision: "exact",
  },
  {
    id: "mock:2",
    name: "Mock Repeater South",
    latitude: 41.0,
    longitude: -72.0,
    sourceType: "repeaterbook",
    sourceLabel: "Mock",
    precision: "exact",
  },
];

/**
 * An in-memory source for tests. Trigger error paths with the sentinel query
 * `text: "fail:network"` or `id: "missing"`.
 */
export class MockTargetSource implements TargetSource {
  readonly info: TargetSourceInfo = {
    id: "mock",
    label: "Mock",
    sourceType: "repeaterbook",
    experimental: true,
  };

  async search(request: SearchRequest): Promise<SourceResult<readonly Target[]>> {
    if (request.text === "fail:network") {
      return { ok: false, error: networkError("Simulated network failure.") };
    }
    const matches = request.text
      ? MOCK_TARGETS.filter((t) => t.name.toLowerCase().includes(request.text!.toLowerCase()))
      : MOCK_TARGETS;
    return { ok: true, value: matches.slice(0, request.maxResults ?? matches.length) };
  }

  async lookup(request: LookupRequest): Promise<SourceResult<Target>> {
    const match = MOCK_TARGETS.find((t) => t.id === request.id);
    if (!match) {
      return { ok: false, error: unavailableError(`No target for id "${request.id}".`) };
    }
    return { ok: true, value: match };
  }
}
