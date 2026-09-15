import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { blendAngleDeg } from "@/domain";

/** Smoothed compass reading. `trueDeg` is null when true north is unavailable. */
export interface HeadingReading {
  magneticDeg: number;
  trueDeg: number | null;
  /** Platform calibration level: 0 none, 1 low, 2 medium, 3 high. */
  accuracy: number;
}

export type HeadingState =
  { status: "unavailable" } | { status: "active"; reading: HeadingReading };

// Modest circular smoothing: lower alpha dampens magnetometer twitch at the cost
// of a little lag. 0.15 keeps it readable without feeling sluggish.
const SMOOTHING_ALPHA = 0.15;

/**
 * Subscribes to compass updates while mounted and the app is foregrounded, and
 * applies circular smoothing. Unsubscribes on unmount and while backgrounded.
 */
export function useHeading(): HeadingState {
  const [state, setState] = useState<HeadingState>({ status: "unavailable" });
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const magSmoothed = useRef<number | null>(null);
  const trueSmoothed = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const onReading = (h: Location.LocationHeadingObject) => {
      magSmoothed.current =
        magSmoothed.current == null
          ? h.magHeading
          : blendAngleDeg(magSmoothed.current, h.magHeading, SMOOTHING_ALPHA);

      const rawTrue = h.trueHeading >= 0 ? h.trueHeading : null;
      if (rawTrue == null) {
        trueSmoothed.current = null;
      } else {
        trueSmoothed.current =
          trueSmoothed.current == null
            ? rawTrue
            : blendAngleDeg(trueSmoothed.current, rawTrue, SMOOTHING_ALPHA);
      }

      setState({
        status: "active",
        reading: {
          magneticDeg: magSmoothed.current,
          trueDeg: trueSmoothed.current,
          accuracy: h.accuracy,
        },
      });
    };

    const subscribe = async () => {
      try {
        const sub = await Location.watchHeadingAsync(onReading);
        if (cancelled) {
          sub.remove();
        } else {
          subscription.current = sub;
        }
      } catch {
        if (!cancelled) {
          setState({ status: "unavailable" });
        }
      }
    };

    const unsubscribe = () => {
      subscription.current?.remove();
      subscription.current = null;
    };

    void subscribe();

    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        if (subscription.current == null) {
          void subscribe();
        }
      } else {
        unsubscribe();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      appStateSub.remove();
    };
  }, []);

  return state;
}
