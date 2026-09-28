import { toSavedTarget, type SavedTarget } from "./saved-target";
import type { Target } from "./target";
import { toggleFavorite, upsertRecent } from "./target-lists";

export const RECENTS_CAP = 15;

/** A mutation applied before hydration finished, replayed onto the loaded data. */
type PendingOp =
  { kind: "toggleFavorite"; target: SavedTarget } | { kind: "addRecent"; target: SavedTarget };

export interface TargetListsState {
  favorites: SavedTarget[];
  recents: SavedTarget[];
  hydrated: boolean;
  pending: PendingOp[];
}

export type TargetListsAction =
  | { type: "hydrate"; favorites: SavedTarget[]; recents: SavedTarget[] }
  | { type: "toggleFavorite"; target: Target | SavedTarget }
  | { type: "addRecent"; target: Target };

export const initialTargetListsState: TargetListsState = {
  favorites: [],
  recents: [],
  hydrated: false,
  pending: [],
};

export function targetListsReducer(
  state: TargetListsState,
  action: TargetListsAction,
): TargetListsState {
  switch (action.type) {
    case "hydrate": {
      // Replay any pre-hydration mutations onto the stored data so stored items
      // survive and the early mutation is preserved.
      if (state.hydrated) {
        return state;
      }
      let favorites = action.favorites;
      let recents = action.recents;
      for (const op of state.pending) {
        if (op.kind === "toggleFavorite") {
          favorites = toggleFavorite(favorites, op.target);
        } else {
          recents = upsertRecent(recents, op.target, RECENTS_CAP);
        }
      }
      return { favorites, recents, hydrated: true, pending: [] };
    }
    case "toggleFavorite": {
      const target = toSavedTarget(action.target);
      const favorites = toggleFavorite(state.favorites, target);
      const pending = state.hydrated
        ? state.pending
        : [...state.pending, { kind: "toggleFavorite", target } as const];
      return { ...state, favorites, pending };
    }
    case "addRecent": {
      const target = toSavedTarget(action.target);
      const recents = upsertRecent(state.recents, target, RECENTS_CAP);
      const pending = state.hydrated
        ? state.pending
        : [...state.pending, { kind: "addRecent", target } as const];
      return { ...state, recents, pending };
    }
  }
}
