import type { Href } from "expo-router";

import type { Target } from "@/domain";

/** Encode a target for navigation params. */
export function encodeTargetParam(target: Target): string {
  return JSON.stringify(target);
}

/** Decode a target navigation param, or null if missing/invalid. */
export function decodeTargetParam(raw: string | undefined): Target | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<Target>;
    if (
      value &&
      typeof value.latitude === "number" &&
      typeof value.longitude === "number" &&
      typeof value.name === "string" &&
      typeof value.id === "string"
    ) {
      return value as Target;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Build the pointing route for a target. */
export function pointingHref(target: Target): Href {
  return { pathname: "/pointing", params: { target: encodeTargetParam(target) } };
}
