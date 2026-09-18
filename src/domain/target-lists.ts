/** Minimal shape the list helpers rely on. */
interface Identified {
  id: string;
}

/** Add `item` to the front of a recents list, de-duplicating by id and capping length. */
export function upsertRecent<T extends Identified>(
  recents: readonly T[],
  item: T,
  cap: number,
): T[] {
  const withoutDup = recents.filter((t) => t.id !== item.id);
  return [item, ...withoutDup].slice(0, Math.max(0, cap));
}

/** Toggle `item` in a favorites list (by id). */
export function toggleFavorite<T extends Identified>(favorites: readonly T[], item: T): T[] {
  return favorites.some((t) => t.id === item.id)
    ? favorites.filter((t) => t.id !== item.id)
    : [item, ...favorites];
}

/** True if an item with `id` is present in the list. */
export function containsTarget(list: readonly Identified[], id: string): boolean {
  return list.some((t) => t.id === id);
}
