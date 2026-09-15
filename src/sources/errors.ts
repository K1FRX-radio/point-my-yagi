/** Category of failure a target source can report. */
export type SourceErrorCategory =
  "network" | "authentication" | "rateLimit" | "permission" | "parsing" | "unavailable";

/** A normalized, user-presentable failure from a target source. */
export interface SourceError {
  category: SourceErrorCategory;
  /** Human-readable message safe to show in the UI. */
  message: string;
  /** Whether retrying the same request could plausibly succeed later. */
  retriable: boolean;
  /** Original error/context, for logging only. Never shown to the user. */
  cause?: unknown;
}

/** Result of a source operation. */
export type SourceResult<T> = { ok: true; value: T } | { ok: false; error: SourceError };

const RETRIABLE: Record<SourceErrorCategory, boolean> = {
  network: true,
  rateLimit: true,
  unavailable: true,
  authentication: false,
  permission: false,
  parsing: false,
};

export function sourceError(
  category: SourceErrorCategory,
  message: string,
  cause?: unknown,
): SourceError {
  return { category, message, retriable: RETRIABLE[category], cause };
}

export const networkError = (message: string, cause?: unknown): SourceError =>
  sourceError("network", message, cause);
export const authenticationError = (message: string, cause?: unknown): SourceError =>
  sourceError("authentication", message, cause);
export const rateLimitError = (message: string, cause?: unknown): SourceError =>
  sourceError("rateLimit", message, cause);
export const permissionError = (message: string, cause?: unknown): SourceError =>
  sourceError("permission", message, cause);
export const parsingError = (message: string, cause?: unknown): SourceError =>
  sourceError("parsing", message, cause);
export const unavailableError = (message: string, cause?: unknown): SourceError =>
  sourceError("unavailable", message, cause);

export function isSourceError(value: unknown): value is SourceError {
  return (
    typeof value === "object" &&
    value !== null &&
    "category" in value &&
    "message" in value &&
    "retriable" in value
  );
}
