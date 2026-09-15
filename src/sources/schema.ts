import { parsingError, type SourceResult } from "./errors";

/** Thrown by the field extractors below when remote data does not match the schema. */
export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaError";
  }
}

export function asRecord(value: unknown, path = "$"): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SchemaError(`Expected an object at ${path}`);
  }
  return value as Record<string, unknown>;
}

export function asArray(value: unknown, path = "$"): unknown[] {
  if (!Array.isArray(value)) {
    throw new SchemaError(`Expected an array at ${path}`);
  }
  return value;
}

export function getString(obj: Record<string, unknown>, key: string, path = "$"): string {
  const value = obj[key];
  if (typeof value !== "string") {
    throw new SchemaError(`Expected string at ${path}.${key}`);
  }
  return value;
}

export function getOptionalString(
  obj: Record<string, unknown>,
  key: string,
  path = "$",
): string | undefined {
  const value = obj[key];
  if (value == null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new SchemaError(`Expected string at ${path}.${key}`);
  }
  return value;
}

export function getNumber(obj: Record<string, unknown>, key: string, path = "$"): number {
  const value = obj[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  throw new SchemaError(`Expected finite number at ${path}.${key}`);
}

export function getOptionalNumber(
  obj: Record<string, unknown>,
  key: string,
  path = "$",
): number | undefined {
  const value = obj[key];
  if (value == null) {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  throw new SchemaError(`Expected finite number at ${path}.${key}`);
}

/**
 * Coerce a number-or-numeric-string (common in loosely typed feeds) to a finite
 * number, or `undefined` when absent/blank. Throws for non-numeric values.
 */
export function getOptionalNumberLike(
  obj: Record<string, unknown>,
  key: string,
  path = "$",
): number | undefined {
  const value = obj[key];
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed === "number" && Number.isFinite(parsed)) {
    return parsed;
  }
  throw new SchemaError(`Expected numeric value at ${path}.${key}`);
}

/**
 * Runs a parser that reads untrusted remote data, converting a {@link SchemaError}
 * into a parsing {@link SourceError}. Other errors propagate.
 */
export function parseRemote<T>(parse: () => T): SourceResult<T> {
  try {
    return { ok: true, value: parse() };
  } catch (error) {
    if (error instanceof SchemaError) {
      return { ok: false, error: parsingError(error.message, error) };
    }
    throw error;
  }
}
