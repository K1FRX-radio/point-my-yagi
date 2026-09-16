import { describe, expect, it } from "vitest";

import type { Target } from "./target";
import { containsTarget, toggleFavorite, upsertRecent } from "./target-lists";

function target(id: string, name = id): Target {
  return {
    id,
    name,
    latitude: 0,
    longitude: 0,
    sourceType: "manual",
    sourceLabel: "Manual",
    precision: "high",
  };
}

describe("upsertRecent", () => {
  it("prepends and de-duplicates by id", () => {
    let recents: Target[] = [];
    recents = upsertRecent(recents, target("a"), 3);
    recents = upsertRecent(recents, target("b"), 3);
    recents = upsertRecent(recents, target("a"), 3);
    expect(recents.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("caps the list length, dropping the oldest", () => {
    let recents: Target[] = [];
    for (const id of ["a", "b", "c", "d"]) {
      recents = upsertRecent(recents, target(id), 3);
    }
    expect(recents.map((t) => t.id)).toEqual(["d", "c", "b"]);
  });
});

describe("toggleFavorite", () => {
  it("adds when absent and removes when present", () => {
    let favorites = toggleFavorite([], target("a"));
    expect(containsTarget(favorites, "a")).toBe(true);
    favorites = toggleFavorite(favorites, target("a"));
    expect(containsTarget(favorites, "a")).toBe(false);
  });
});
