import { describe, expect, it } from "vitest";

import {
  authenticationError,
  isSourceError,
  networkError,
  parsingError,
  permissionError,
  rateLimitError,
  sourceError,
  unavailableError,
} from "./errors";

describe("source errors", () => {
  it("marks transient categories retriable and terminal ones not", () => {
    expect(networkError("x").retriable).toBe(true);
    expect(rateLimitError("x").retriable).toBe(true);
    expect(unavailableError("x").retriable).toBe(true);
    expect(authenticationError("x").retriable).toBe(false);
    expect(permissionError("x").retriable).toBe(false);
    expect(parsingError("x").retriable).toBe(false);
  });

  it("preserves category, message, and cause", () => {
    const cause = new Error("boom");
    const err = sourceError("network", "no connection", cause);
    expect(err).toMatchObject({ category: "network", message: "no connection", cause });
  });

  it("recognizes SourceError shapes", () => {
    expect(isSourceError(networkError("x"))).toBe(true);
    expect(isSourceError({})).toBe(false);
    expect(isSourceError(null)).toBe(false);
    expect(isSourceError("network")).toBe(false);
  });
});
