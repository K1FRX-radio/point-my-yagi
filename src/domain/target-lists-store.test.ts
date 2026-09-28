import { describe, expect, it } from "vitest";

import type { Target } from "./target";
import {
  initialTargetListsState,
  RECENTS_CAP,
  targetListsReducer,
  type TargetListsState,
} from "./target-lists-store";

function target(id: string, name = id): Target {
  return {
    id,
    name,
    latitude: 40,
    longitude: -105,
    sourceType: "manual",
    sourceLabel: "Manual",
    precision: "high",
  };
}

function apply(
  state: TargetListsState,
  ...actions: Parameters<typeof targetListsReducer>[1][]
): TargetListsState {
  return actions.reduce(targetListsReducer, state);
}

describe("targetListsReducer", () => {
  it("hydrates stored favorites and recents", () => {
    const next = targetListsReducer(initialTargetListsState, {
      type: "hydrate",
      favorites: [target("a")],
      recents: [target("b")],
    });

    expect(next.hydrated).toBe(true);
    expect(next.favorites.map((t) => t.id)).toEqual(["a"]);
    expect(next.recents.map((t) => t.id)).toEqual(["b"]);
    expect(next.pending).toEqual([]);
  });

  it("toggles a favorite on and off after hydration", () => {
    const hydrated = targetListsReducer(initialTargetListsState, {
      type: "hydrate",
      favorites: [],
      recents: [],
    });

    const added = targetListsReducer(hydrated, { type: "toggleFavorite", target: target("a") });
    expect(added.favorites.map((t) => t.id)).toEqual(["a"]);

    const removed = targetListsReducer(added, { type: "toggleFavorite", target: target("a") });
    expect(removed.favorites).toEqual([]);
  });

  it("adds recents newest-first, de-duplicated and capped", () => {
    let state = targetListsReducer(initialTargetListsState, {
      type: "hydrate",
      favorites: [],
      recents: [],
    });
    for (let i = 0; i < RECENTS_CAP + 3; i += 1) {
      state = targetListsReducer(state, { type: "addRecent", target: target(`r${i}`) });
    }

    expect(state.recents).toHaveLength(RECENTS_CAP);
    expect(state.recents[0]?.id).toBe(`r${RECENTS_CAP + 2}`);
  });

  it("preserves stored favorites when a favorite is toggled before hydration", () => {
    // User already has favorites in storage but toggles a new one before the
    // read resolves.
    const early = targetListsReducer(initialTargetListsState, {
      type: "toggleFavorite",
      target: target("new"),
    });
    expect(early.hydrated).toBe(false);
    expect(early.pending).toHaveLength(1);

    const hydrated = targetListsReducer(early, {
      type: "hydrate",
      favorites: [target("stored1"), target("stored2")],
      recents: [],
    });

    expect(hydrated.hydrated).toBe(true);
    expect(hydrated.favorites.map((t) => t.id).sort()).toEqual(["new", "stored1", "stored2"]);
    expect(hydrated.pending).toEqual([]);
  });

  it("does not erase stored favorites when only recents are touched before hydration", () => {
    const early = targetListsReducer(initialTargetListsState, {
      type: "addRecent",
      target: target("r-new"),
    });

    const hydrated = targetListsReducer(early, {
      type: "hydrate",
      favorites: [target("fav1"), target("fav2")],
      recents: [target("r-old")],
    });

    expect(hydrated.favorites.map((t) => t.id)).toEqual(["fav1", "fav2"]);
    expect(hydrated.recents.map((t) => t.id)).toEqual(["r-new", "r-old"]);
  });

  it("replays multiple pre-hydration mutations in order onto stored data", () => {
    const early = apply(
      initialTargetListsState,
      { type: "toggleFavorite", target: target("x") },
      { type: "addRecent", target: target("y") },
      { type: "toggleFavorite", target: target("x") },
    );

    const hydrated = targetListsReducer(early, {
      type: "hydrate",
      favorites: [target("stored")],
      recents: [],
    });

    // x was toggled on then off, so it should be gone; stored survives.
    expect(hydrated.favorites.map((t) => t.id)).toEqual(["stored"]);
    expect(hydrated.recents.map((t) => t.id)).toEqual(["y"]);
  });

  it("ignores a second hydrate after the first", () => {
    const first = targetListsReducer(initialTargetListsState, {
      type: "hydrate",
      favorites: [target("a")],
      recents: [],
    });
    const second = targetListsReducer(first, {
      type: "hydrate",
      favorites: [target("b")],
      recents: [target("c")],
    });

    expect(second).toBe(first);
  });
});
