import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { containsTarget, toggleFavorite, upsertRecent, type Target } from "@/domain";

const FAVORITES_KEY = "pmy.favorites.v1";
const RECENTS_KEY = "pmy.recents.v1";
const RECENTS_CAP = 15;

function parseTargets(raw: string | null): Target[] {
  if (!raw) {
    return [];
  }
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as Target[]) : [];
  } catch {
    return [];
  }
}

export interface TargetLists {
  favorites: Target[];
  recents: Target[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (target: Target) => void;
  addRecent: (target: Target) => void;
}

/** Offline favorites and recent targets, persisted with AsyncStorage. */
export function useTargetLists(): TargetLists {
  const [favorites, setFavorites] = useState<Target[]>([]);
  const [recents, setRecents] = useState<Target[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [favRaw, recRaw] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(RECENTS_KEY),
        ]);
        if (active) {
          setFavorites(parseTargets(favRaw));
          setRecents(parseTargets(recRaw));
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

  const toggle = useCallback((target: Target) => {
    setFavorites((prev) => toggleFavorite(prev, target));
  }, []);

  const addRecent = useCallback((target: Target) => {
    setRecents((prev) => upsertRecent(prev, target, RECENTS_CAP));
  }, []);

  const isFavorite = useCallback((id: string) => containsTarget(favorites, id), [favorites]);

  return { favorites, recents, isFavorite, toggleFavorite: toggle, addRecent };
}
