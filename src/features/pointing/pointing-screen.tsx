import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import {
    greatCircleDistanceMeters,
    initialBearingDeg,
    signedRotation,
    turnInstruction,
} from "@/domain";
import { useForegroundLocation } from "@/features/location/use-foreground-location";
import { PointerArrow } from "@/features/pointing/pointer-arrow";
import { useHeading } from "@/features/pointing/use-heading";
import { useTheme } from "@/hooks/use-theme";

const METERS_PER_MILE = 1609.344;
const ALIGN_TOLERANCE_DEG = 5;
const ALIGNED_COLOR = "#12A150";
const CAUTION_COLOR = "#C7791B";

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatBearing(deg: number): string {
  const rounded = Math.round(deg) % 360;
  return `${String(rounded).padStart(3, "0")}\u00B0`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  const miles = meters / METERS_PER_MILE;
  if (km < 1) {
    return `${Math.round(meters)} m / ${(miles * 5280).toFixed(0)} ft`;
  }
  return `${km.toFixed(1)} km / ${miles.toFixed(1)} mi`;
}

function gpsAccuracyLabel(meters: number | null): { text: string; caution: boolean } {
  if (meters == null) {
    return { text: "GPS accuracy unknown", caution: true };
  }
  return { text: `GPS accuracy \u00B1${Math.round(meters)} m`, caution: meters > 50 };
}

function headingAccuracyLabel(accuracy: number): { text: string; poor: boolean } {
  const levels = ["none", "low", "medium", "high"];
  const level = levels[accuracy] ?? "unknown";
  return { text: `Compass accuracy: ${level}`, poor: accuracy <= 1 };
}

export function PointingScreen() {
  const theme = useTheme();
  useKeepAwake();

  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const { state, refresh } = useForegroundLocation();
  const heading = useHeading();

  const target = {
    latitude: Number(single(params.latitude)),
    longitude: Number(single(params.longitude)),
    name: single(params.name) || "Target",
    sourceLabel: single(params.sourceLabel) || "Manual",
    locationWarning: single(params.locationWarning),
  };

  const from =
    state.status === "ready" ? { latitude: state.latitude, longitude: state.longitude } : null;
  const bearing = from
    ? initialBearingDeg(from, { latitude: target.latitude, longitude: target.longitude })
    : null;

  const trueHeadingDeg = heading.status === "active" ? heading.reading.trueDeg : null;
  const turn =
    bearing != null && trueHeadingDeg != null
      ? turnInstruction(trueHeadingDeg, bearing, ALIGN_TOLERANCE_DEG)
      : null;
  const aligned = turn?.aligned ?? false;

  const wasAligned = useRef(false);
  useEffect(() => {
    if (aligned && !wasAligned.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasAligned.current = aligned;
  }, [aligned]);

  if (state.status === "loading") {
    return (
      <Centered>
        <ActivityIndicator size="large" color={theme.text} />
        <ThemedText type="subtitle">Getting your location…</ThemedText>
      </Centered>
    );
  }

  if (state.status === "denied") {
    return (
      <Centered>
        <ThemedText type="subtitle">Location permission needed</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          {state.canAskAgain
            ? "Point My Yagi needs your location to compute the bearing to the target."
            : "Enable location for this app in system settings, then try again."}
        </ThemedText>
        <RetryButton onPress={refresh} />
      </Centered>
    );
  }

  if (state.status === "unavailable") {
    return (
      <Centered>
        <ThemedText type="subtitle">Location unavailable</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          {state.message}
        </ThemedText>
        <RetryButton onPress={refresh} />
      </Centered>
    );
  }

  const distanceMeters = greatCircleDistanceMeters(
    { latitude: state.latitude, longitude: state.longitude },
    { latitude: target.latitude, longitude: target.longitude },
  );
  const gpsAccuracy = gpsAccuracyLabel(state.accuracyMeters);
  const bearingText = bearing != null ? formatBearing(bearing) : "—";

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBlock}>
            <ThemedText type="subtitle">{target.name}</ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Source: {target.sourceLabel}
            </ThemedText>
          </View>

          {turn ? (
            <>
              <PointerArrow
                rotationDeg={turn.rotation}
                northDeg={signedRotation(trueHeadingDeg ?? 0, 0)}
                color={aligned ? ALIGNED_COLOR : theme.text}
                trackColor={theme.backgroundSelected}
              />
              <ThemedText style={[styles.turnText, aligned && { color: ALIGNED_COLOR }]}>
                {aligned
                  ? "On target"
                  : `Turn ${Math.round(Math.abs(turn.rotation))}\u00B0 ${turn.direction}`}
              </ThemedText>
            </>
          ) : (
            <View style={styles.fallbackBlock}>
              <ThemedText style={styles.bearingValue}>{bearingText}</ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary">
                TRUE BEARING
              </ThemedText>
              <ThemedText type="small" style={{ color: CAUTION_COLOR }}>
                {heading.status === "active"
                  ? "True-north compass unavailable on this device. Showing true bearing only."
                  : "Live compass unavailable. Showing true bearing only."}
              </ThemedText>
            </View>
          )}

          <View style={styles.readoutRow}>
            <Readout label="TRUE BEARING" value={bearingText} />
            <Readout
              label="HEADING"
              value={trueHeadingDeg != null ? formatBearing(trueHeadingDeg) : "—"}
            />
            <Readout label="DISTANCE" value={formatDistance(distanceMeters)} />
          </View>

          <View style={styles.footerBlock}>
            <ThemedText type="small" themeColor="textSecondary">
              Hold the phone flat with its top edge along the boom, pointing toward the directors.
            </ThemedText>
            {heading.status === "active" ? (
              <HeadingAccuracy accuracy={heading.reading.accuracy} theme={theme} />
            ) : null}
            <ThemedText
              type="smallBold"
              style={{ color: gpsAccuracy.caution ? CAUTION_COLOR : theme.textSecondary }}
            >
              {gpsAccuracy.text}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Metal nearby (the antenna, radio, battery, tripod, vehicles, buildings) can skew the
              compass.
            </ThemedText>
            {target.locationWarning ? (
              <ThemedText type="small" themeColor="textSecondary">
                {target.locationWarning}
              </ThemedText>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function HeadingAccuracy({
  accuracy,
  theme,
}: {
  accuracy: number;
  theme: ReturnType<typeof useTheme>;
}) {
  const label = headingAccuracyLabel(accuracy);
  return (
    <>
      <ThemedText
        type="smallBold"
        style={{ color: label.poor ? CAUTION_COLOR : theme.textSecondary }}
      >
        {label.text}
      </ThemedText>
      {label.poor ? (
        <ThemedText type="small" style={{ color: CAUTION_COLOR }}>
          Move the phone slowly in a figure-8 to calibrate the compass.
        </ThemedText>
      ) : null}
    </>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readout}>
      <ThemedText style={styles.readoutValue}>{value}</ThemedText>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.centered}>{children}</SafeAreaView>
    </ThemedView>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.retry,
        { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <ThemedText style={[styles.retryLabel, { color: theme.background }]}>Try again</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centerText: { textAlign: "center" },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.four,
    alignItems: "center",
  },
  headerBlock: { gap: Spacing.one, alignSelf: "stretch" },
  turnText: { fontSize: 32, fontWeight: "800" },
  fallbackBlock: { alignItems: "center", gap: Spacing.one },
  bearingValue: { fontSize: 96, fontWeight: "800", lineHeight: 104 },
  readoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    gap: Spacing.two,
  },
  readout: { flex: 1, alignItems: "center", gap: Spacing.half },
  readoutValue: { fontSize: 18, fontWeight: "700" },
  footerBlock: { gap: Spacing.two, alignSelf: "stretch" },
  retry: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.two,
  },
  retryLabel: { fontSize: 18, fontWeight: "700" },
});
