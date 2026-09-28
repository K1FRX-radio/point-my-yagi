import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  containsTarget,
  toggleFavorite,
  toSavedTarget,
  upsertRecent,
  type SavedTarget,
  type Target,
} from "@/domain";

const FAVORITES_KEY = "pmy.favorites.v1";
const RECENTS_KEY = "pmy.recents.v1";
const RECENTS_CAP = 15;

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

const TargetListsContext = createContext<TargetLists>({
  favorites: [],
  recents: [],
  isFavorite: () => false,
  toggleFavorite: () => {},
  addRecent: () => {},
});

/** Shared offline favorites and recent targets, persisted with AsyncStorage. */
export function TargetListsProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<SavedTarget[]>([]);
  const [recents, setRecents] = useState<SavedTarget[]>([]);
  const loaded = useRef(false);
  // A user action can mutate state before hydration resolves; don't let the
  // initial load clobber it.
  const touched = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [favRaw, recRaw] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(RECENTS_KEY),
        ]);
        if (active && !touched.current) {
          setFavorites(parseSaved(favRaw));
          setRecents(parseSaved(recRaw));
        }
      } catch {
        // ignore: start empty
      } finally {
        if (active) {
          loaded.current = true;
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) {
      return;
    }
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites]);

  useEffect(() => {
    if (!loaded.current) {
      return;
    }
    AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(recents)).catch(() => {});
  }, [recents]);

  const toggle = useCallback((target: Target | SavedTarget) => {
    touched.current = true;
    setFavorites((prev) => toggleFavorite(prev, toSavedTarget(target)));
  }, []);

  const addRecent = useCallback((target: Target) => {
    touched.current = true;
    setRecents((prev) => upsertRecent(prev, toSavedTarget(target), RECENTS_CAP));
  }, []);

  const isFavorite = useCallback((id: string) => containsTarget(favorites, id), [favorites]);

  const value = useMemo(
    () => ({ favorites, recents, isFavorite, toggleFavorite: toggle, addRecent }),
    [favorites, recents, isFavorite, toggle, addRecent],
  );
  return <TargetListsContext value={value}>{children}</TargetListsContext>;
}

/** Consume the shared favorites/recents state. */
export function useTargetLists(): TargetLists {
  return use(TargetListsContext);
}
