import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

/** Foreground location acquisition state machine. */
export type LocationState =
  | { status: "loading" }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "unavailable"; message: string }
  | {
      status: "ready";
      latitude: number;
      longitude: number;
      accuracyMeters: number | null;
      timestamp: number;
    };

async function acquire(): Promise<LocationState> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    return { status: "denied", canAskAgain: permission.canAskAgain };
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return {
      status: "unavailable",
      message: "Location services are turned off. Enable them in system settings.",
    };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    status: "ready",
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

/**
 * Requests foreground location permission and obtains a single current fix.
 * Returns the current {@link LocationState} and a `refresh` to retry.
 */
export function useForegroundLocation() {
  const [state, setState] = useState<LocationState>({ status: "loading" });
  const isMounted = useRef(true);

  // setState only happens after an await, so it is not a synchronous effect update.
  const runAcquire = useCallback(async () => {
    try {
      const next = await acquire();
      if (isMounted.current) {
        setState(next);
      }
    } catch (error) {
      if (isMounted.current) {
        setState({
          status: "unavailable",
          message: error instanceof Error ? error.message : "Could not determine your location.",
        });
      }
    }
  }, []);

  const refresh = useCallback(() => {
    setState({ status: "loading" });
    void runAcquire();
  }, [runAcquire]);

  useEffect(() => {
    isMounted.current = true;
    // Mount-time async fetch: setState runs only after an await, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runAcquire();
    return () => {
      isMounted.current = false;
    };
  }, [runAcquire]);

  return { state, refresh };
}
