import { bandForMhz, greatCircleDistanceMeters, type Target } from "@/domain";

import type { SearchRequest } from "./target-source";

/**
 * Pure, order-preserving filter used by both source adapters and list UIs.
 * When `near` is provided, results are filtered by `maxDistanceKm` (if any) and
 * sorted nearest-first. All text matching is case-insensitive substring.
 */
export function filterTargets(targets: readonly Target[], request: SearchRequest): Target[] {
  let results = [...targets];

  if (request.mode) {
    const mode = request.mode.toLowerCase();
    results = results.filter((t) => t.mode?.toLowerCase() === mode);
  }

  if (request.band) {
    results = results.filter((t) => bandForMhz(t.frequencyMhz) === request.band);
  }

  if (request.region) {
    const region = request.region.toLowerCase();
    results = results.filter(
      (t) =>
        (t.grid?.toLowerCase().includes(region) ?? false) ||
        (t.adminRegion?.toLowerCase().includes(region) ?? false),
    );
  }

  if (request.text) {
    const query = request.text.toLowerCase();
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.callsign?.toLowerCase().includes(query) ?? false),
    );
  }

  if (request.near) {
    const near = request.near;
    const maxMeters =
      request.maxDistanceKm != null ? request.maxDistanceKm * 1000 : Number.POSITIVE_INFINITY;
    results = results
      .map((target) => ({ target, distance: greatCircleDistanceMeters(near, target) }))
      .filter((entry) => entry.distance <= maxMeters)
      .sort((a, b) => a.distance - b.distance)
      .map((entry) => entry.target);
  }

  if (request.maxResults != null) {
    results = results.slice(0, request.maxResults);
  }

  return results;
}
