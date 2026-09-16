import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import { utcDayKey, workedKey } from "@/domain";

// Bump the suffix if the stored shape changes.
const STORAGE_KEY = "pmy.workedToday.v1";

interface Persisted {
  day: string;
  keys: string[];
}

export interface WorkedToday {
  isWorked: (callsign: string, recordId: string) => boolean;
  toggle: (callsign: string, recordId: string) => void;
  count: number;
}

/**
 * Tracks activator+park contacts marked "worked" for the current UTC day, backed
 * by AsyncStorage. Entries from previous days are dropped on load. Best-effort:
 * storage errors are swallowed so the UI never breaks.
 */
export function useWorkedToday(): WorkedToday {
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const loaded = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const today = utcDayKey(Date.now());
      let initial = new Set<string>();
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: Persisted | null = raw ? JSON.parse(raw) : null;
        if (parsed && parsed.day === today && Array.isArray(parsed.keys)) {
          initial = new Set(parsed.keys);
        }
      } catch {
        // ignore: worked-today is a best-effort convenience
      }
      if (active) {
        loaded.current = true;
        setKeys(initial);
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
    const payload: Persisted = { day: utcDayKey(Date.now()), keys: [...keys] };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [keys]);

  const toggle = useCallback((callsign: string, recordId: string) => {
    const key = workedKey(callsign, recordId);
    setKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isWorked = useCallback(
    (callsign: string, recordId: string) => keys.has(workedKey(callsign, recordId)),
    [keys],
  );

  return { isWorked, toggle, count: keys.size };
}
