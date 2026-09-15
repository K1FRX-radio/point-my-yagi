import type { LatLon, ManualTargetInput, Target, TargetSourceType } from "@/domain";

import type { SourceResult } from "./errors";

/** Static description of a source, for display, attribution, and gating. */
export interface TargetSourceInfo {
  /** Stable id, e.g. "manual", "pota". */
  id: string;
  /** Display label. */
  label: string;
  sourceType: TargetSourceType;
  /** Required attribution text, where the source's policy demands it. */
  attribution?: string;
  /** Link to the source or the relevant record, for attribution. */
  attributionUrl?: string;
  /** Marks sources not cleared for production (e.g. pending policy approval). */
  experimental?: boolean;
}

/** Query for sources that can search/list (e.g. POTA spots). */
export interface SearchRequest {
  text?: string;
  near?: LatLon;
  maxResults?: number;
}

/** Query for sources that resolve a single record by identifier (repeater, callsign, park). */
export interface LookupRequest {
  id: string;
}

/** Input for sources that build a target from user-entered data (manual). */
export interface CreateRequest {
  input: ManualTargetInput;
}

/**
 * A source of pointing targets. Capabilities are optional: a source implements
 * only the operations it can support, and callers narrow with the guards below.
 */
export interface TargetSource {
  readonly info: TargetSourceInfo;
  create?(request: CreateRequest): SourceResult<Target>;
  search?(request: SearchRequest): Promise<SourceResult<readonly Target[]>>;
  lookup?(request: LookupRequest): Promise<SourceResult<Target>>;
}

export type CreateCapableSource = TargetSource & Required<Pick<TargetSource, "create">>;
export type SearchCapableSource = TargetSource & Required<Pick<TargetSource, "search">>;
export type LookupCapableSource = TargetSource & Required<Pick<TargetSource, "lookup">>;

export const canCreate = (source: TargetSource): source is CreateCapableSource =>
  typeof source.create === "function";
export const canSearch = (source: TargetSource): source is SearchCapableSource =>
  typeof source.search === "function";
export const canLookup = (source: TargetSource): source is LookupCapableSource =>
  typeof source.lookup === "function";
