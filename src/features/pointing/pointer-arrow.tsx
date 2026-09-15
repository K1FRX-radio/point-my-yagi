import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { normalizeDegrees, signedRotation } from "@/domain";

const NORTH_COLOR = "#E5484D";
// Longer easing than the sensor cadence further dampens residual twitch.
const ROTATION_DURATION_MS = 220;

interface PointerArrowProps {
  /** Signed angle to the target relative to the phone's top edge; +right. */
  rotationDeg: number;
  /** Signed angle to true north relative to the phone's top edge; +right. */
  northDeg: number;
  color: string;
  trackColor: string;
  size?: number;
}

/** Animates a degrees value along the shortest path and returns a rotate string. */
function useShortestPathRotation(targetDeg: number): Animated.AnimatedInterpolation<string> {
  const [animated] = useState(() => new Animated.Value(0));
  const accumulated = useRef(0);

  useEffect(() => {
    const current = normalizeDegrees(accumulated.current);
    accumulated.current += signedRotation(current, targetDeg);
    Animated.timing(animated, {
      toValue: accumulated.current,
      duration: ROTATION_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [targetDeg, animated]);

  return animated.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });
}

/**
 * A dial with an arrow that points at the target plus a North marker on the ring.
 * Both rotate along the shortest path so they never spin the long way around 0/360.
 */
export function PointerArrow({
  rotationDeg,
  northDeg,
  color,
  trackColor,
  size = 240,
}: PointerArrowProps) {
  const arrowRotate = useShortestPathRotation(rotationDeg);
  const northRotate = useShortestPathRotation(northDeg);
  const arrowSize = size * 0.16;

  return (
    <View
      style={[
        styles.dial,
        { width: size, height: size, borderRadius: size / 2, borderColor: trackColor },
      ]}
    >
      <Animated.View
        style={[styles.rotor, styles.northRotor, { transform: [{ rotate: northRotate }] }]}
      >
        <View style={[styles.northTick, { backgroundColor: NORTH_COLOR }]} />
        <Text style={[styles.northLabel, { color: NORTH_COLOR }]}>N</Text>
      </Animated.View>

      <Animated.View style={[styles.rotor, { transform: [{ rotate: arrowRotate }] }]}>
        <View
          style={[
            styles.arrow,
            {
              borderLeftWidth: arrowSize * 0.6,
              borderRightWidth: arrowSize * 0.6,
              borderBottomWidth: arrowSize,
              borderBottomColor: color,
            },
          ]}
        />
        <View style={[styles.stem, { backgroundColor: color, height: size * 0.32 }]} />
      </Animated.View>

      <View style={[styles.hub, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  dial: {
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  rotor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 12,
  },
  northRotor: {
    paddingTop: 2,
  },
  northTick: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
  },
  northLabel: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 1,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  stem: {
    width: 4,
    borderRadius: 2,
  },
  hub: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
