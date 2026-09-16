import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Target } from "@/domain";
import { PotaTargetSource, type SourceError } from "@/sources";

export type PotaSpotsState =
  | { status: "loading" }
  | { status: "error"; error: SourceError }
  | { status: "ready"; targets: Target[]; loadedAt: number };

/**
 * Loads current POTA activator spots once on mount and on explicit refresh.
 * Fetching is decoupled from location so the caller can sort by distance without
 * triggering refetches.
 */
export function usePotaSpots() {
  const source = useMemo(() => new PotaTargetSource(), []);
  const [state, setState] = useState<PotaSpotsState>({ status: "loading" });
  const isMounted = useRef(true);

  const run = useCallback(async () => {
    const result = await source.search({});
    if (!isMounted.current) {
      return;
    }
    setState(
      result.ok
        ? { status: "ready", targets: [...result.value], loadedAt: Date.now() }
        : { status: "error", error: result.error },
    );
  }, [source]);

  const refresh = useCallback(() => {
    setState({ status: "loading" });
    void run();
  }, [run]);

  useEffect(() => {
    isMounted.current = true;
    // Deliberate load on entering the screen; setState runs only after an await.
    void run();
    return () => {
      isMounted.current = false;
    };
  }, [run]);

  return { state, refresh };
}
