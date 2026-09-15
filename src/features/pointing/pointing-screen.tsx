import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { greatCircleDistanceMeters, initialBearingDeg } from "@/domain";
import { useForegroundLocation } from "@/features/location/use-foreground-location";

const METERS_PER_MILE = 1609.344;

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

function accuracyLabel(meters: number | null): { text: string; caution: boolean } {
  if (meters == null) {
    return { text: "GPS accuracy unknown", caution: true };
  }
  const rounded = Math.round(meters);
  return { text: `GPS accuracy \u00B1${rounded} m`, caution: meters > 50 };
}

export function PointingScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const { state, refresh } = useForegroundLocation();

  const target = {
    latitude: Number(single(params.latitude)),
    longitude: Number(single(params.longitude)),
    name: single(params.name) || "Target",
    sourceLabel: single(params.sourceLabel) || "Manual",
    locationWarning: single(params.locationWarning),
  };

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

  const from = { latitude: state.latitude, longitude: state.longitude };
  const to = { latitude: target.latitude, longitude: target.longitude };
  const bearing = initialBearingDeg(from, to);
  const distanceMeters = greatCircleDistanceMeters(from, to);
  const accuracy = accuracyLabel(state.accuracyMeters);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.readySafeArea}>
        <View style={styles.headerBlock}>
          <ThemedText type="subtitle">{target.name}</ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Source: {target.sourceLabel}
          </ThemedText>
        </View>

        <View style={styles.bearingBlock}>
          <ThemedText style={styles.bearingValue}>{formatBearing(bearing)}</ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary">
            TRUE BEARING
          </ThemedText>
        </View>

        <View style={styles.distanceBlock}>
          <ThemedText style={styles.distanceValue}>{formatDistance(distanceMeters)}</ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary">
            DISTANCE
          </ThemedText>
        </View>

        <View style={styles.footerBlock}>
          <ThemedText
            type="smallBold"
            style={{ color: accuracy.caution ? "#C7791B" : theme.textSecondary }}
          >
            {accuracy.text}
            {accuracy.caution ? " — hold still for a better fix" : ""}
          </ThemedText>
          {target.locationWarning ? (
            <ThemedText type="small" themeColor="textSecondary">
              {target.locationWarning}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            Live compass pointing comes next. This shows the true bearing only.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  centerText: { textAlign: "center" },
  readySafeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    justifyContent: "space-between",
  },
  headerBlock: { gap: Spacing.one },
  bearingBlock: { alignItems: "center", gap: Spacing.one },
  bearingValue: { fontSize: 120, fontWeight: "800", lineHeight: 128 },
  distanceBlock: { alignItems: "center", gap: Spacing.one },
  distanceValue: { fontSize: 40, fontWeight: "700" },
  footerBlock: { gap: Spacing.two },
  retry: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.two,
  },
  retryLabel: { fontSize: 18, fontWeight: "700" },
});
