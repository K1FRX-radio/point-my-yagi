import type { Href } from "expo-router";

import { decodeTarget, encodeTarget, type Target } from "@/domain";

/** Encode a target for navigation params. */
export function encodeTargetParam(target: Target): string {
  return encodeTarget(target);
}

/** Decode a target navigation param, or null if missing/invalid. Untrusted input. */
export function decodeTargetParam(raw: string | undefined): Target | null {
  return decodeTarget(raw);
}

/** Build the pointing route for a target. */
export function pointingHref(target: Target): Href {
  return { pathname: "/pointing", params: { target: encodeTargetParam(target) } };
}
