import type { Target } from "./target";

/** Add `target` to the front of a recents list, de-duplicating by id and capping length. */
export function upsertRecent(recents: readonly Target[], target: Target, cap: number): Target[] {
  const withoutDup = recents.filter((t) => t.id !== target.id);
  return [target, ...withoutDup].slice(0, Math.max(0, cap));
}

/** Toggle `target` in a favorites list (by id). */
export function toggleFavorite(favorites: readonly Target[], target: Target): Target[] {
  return favorites.some((t) => t.id === target.id)
    ? favorites.filter((t) => t.id !== target.id)
    : [target, ...favorites];
}

/** True if a target with `id` is present in the list. */
export function containsTarget(list: readonly Target[], id: string): boolean {
  return list.some((t) => t.id === id);
}
