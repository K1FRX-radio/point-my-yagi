import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
  type Preferences,
} from "@/features/preferences/preferences";

const STORAGE_KEY = "pmy.preferences.v1";

interface PreferencesContextValue {
  preferences: Preferences;
  update: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: DEFAULT_PREFERENCES,
  update: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const loaded = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      let next = DEFAULT_PREFERENCES;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          next = normalizePreferences(JSON.parse(raw));
        }
      } catch {
        // ignore: fall back to defaults
      }
      if (active) {
        loaded.current = true;
        setPreferences(next);
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => {});
  }, [preferences]);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({ preferences, update }), [preferences, update]);
  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): PreferencesContextValue {
  return use(PreferencesContext);
}
