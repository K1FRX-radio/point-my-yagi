import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, use, useCallback, useEffect, useMemo, useReducer } from "react";

import {
  containsTarget,
  initialTargetListsState,
  targetListsReducer,
  type SavedTarget,
  type Target,
} from "@/domain";

const FAVORITES_KEY = "pmy.favorites.v1";
const RECENTS_KEY = "pmy.recents.v1";

function parseSaved(raw: string | null): SavedTarget[] {
  if (!raw) {
    return [];
  }
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as SavedTarget[]) : [];
  } catch {
    return [];
  }
}

export interface TargetLists {
  favorites: SavedTarget[];
  recents: SavedTarget[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (target: Target | SavedTarget) => void;
  addRecent: (target: Target) => void;
}

const TargetListsContext = createContext<TargetLists | null>(null);

/** Shared offline favorites and recent targets, persisted with AsyncStorage. */
export function TargetListsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(targetListsReducer, initialTargetListsState);
  const { favorites, recents, hydrated } = state;

  useEffect(() => {
    let active = true;
    const load = async () => {
      let favRaw: string | null = null;
      let recRaw: string | null = null;
      try {
        [favRaw, recRaw] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(RECENTS_KEY),
        ]);
      } catch {
        // ignore: hydrate with whatever we read (empty on failure)
      }
      if (active) {
        dispatch({ type: "hydrate", favorites: parseSaved(favRaw), recents: parseSaved(recRaw) });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(recents)).catch(() => {});
  }, [recents, hydrated]);

  const toggle = useCallback((target: Target | SavedTarget) => {
    dispatch({ type: "toggleFavorite", target });
  }, []);

  const addRecent = useCallback((target: Target) => {
    dispatch({ type: "addRecent", target });
  }, []);

  const isFavorite = useCallback((id: string) => containsTarget(favorites, id), [favorites]);

  const value = useMemo(
    () => ({ favorites, recents, isFavorite, toggleFavorite: toggle, addRecent }),
    [favorites, recents, isFavorite, toggle, addRecent],
  );
  return <TargetListsContext value={value}>{children}</TargetListsContext>;
}

/** Consume the shared favorites/recents state. Throws if used outside the provider. */
export function useTargetLists(): TargetLists {
  const value = use(TargetListsContext);
  if (value === null) {
    throw new Error("useTargetLists must be used within a TargetListsProvider");
  }
  return value;
}
