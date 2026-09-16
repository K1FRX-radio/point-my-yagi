/** Minimal structural subset of the fetch API used by source adapters (for injection). */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<FetchResponseLike>;
