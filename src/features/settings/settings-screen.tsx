import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TOLERANCE_OPTIONS } from "@/features/preferences/preferences";
import { usePreferences } from "@/features/preferences/preferences-provider";
import { Segmented } from "@/components/segmented";

export function SettingsScreen() {
  const theme = useTheme();
  const { preferences, update } = usePreferences();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Row label="Distance units">
            <Segmented
              options={[
                { value: "imperial", label: "Miles" },
                { value: "metric", label: "Kilometers" },
              ]}
              value={preferences.distanceUnit}
              onChange={(distanceUnit) => update({ distanceUnit })}
            />
          </Row>

          <Row
            label="Bearing display"
            hint="The pointer always uses true north internally; this only changes the numbers shown."
          >
            <Segmented
              options={[
                { value: "true", label: "True" },
                { value: "magnetic", label: "Magnetic" },
              ]}
              value={preferences.bearingDisplay}
              onChange={(bearingDisplay) => update({ bearingDisplay })}
            />
          </Row>

          <Row label="Alignment tolerance">
            <Segmented
              options={TOLERANCE_OPTIONS.map((deg) => ({
                value: String(deg),
                label: `${deg}\u00B0`,
              }))}
              value={String(preferences.alignmentToleranceDeg)}
              onChange={(v) => update({ alignmentToleranceDeg: Number(v) })}
            />
          </Row>

          <ToggleRow
            label="Haptic near alignment"
            value={preferences.hapticsNearAlignment}
            onValueChange={(hapticsNearAlignment) => update({ hapticsNearAlignment })}
            theme={theme}
          />

          <ToggleRow
            label="High-contrast outdoor theme"
            value={preferences.highContrast}
            onValueChange={(highContrast) => update({ highContrast })}
            theme={theme}
          />

          <View style={styles.row}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              PRIVACY
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your location stays on this device and is used only to compute bearings. Preferences,
              favorites, recents, and any RepeaterBook token are stored locally and never uploaded
              by the app.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  theme,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.row, styles.toggleRow]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.text }}
        thumbColor={theme.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.four },
  row: { gap: Spacing.two },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
