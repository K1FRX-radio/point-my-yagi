import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { buildManualTarget, type ManualTargetInput } from "@/domain";
import { useTheme } from "@/hooks/use-theme";

type EntryMode = "coordinates" | "grid";

export function ManualTargetScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [mode, setMode] = useState<EntryMode>("coordinates");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [grid, setGrid] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit() {
    const input: ManualTargetInput =
      mode === "coordinates"
        ? { kind: "coordinates", latitude, longitude, name }
        : { kind: "grid", grid, name };

    const result = buildManualTarget(input);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    const target = result.value;
    router.push({
      pathname: "/pointing",
      params: {
        latitude: String(target.latitude),
        longitude: String(target.longitude),
        name: target.name,
        sourceLabel: target.sourceLabel,
        precision: target.precision,
        grid: target.grid ?? "",
        locationWarning: target.locationWarning ?? "",
        uncertaintyRadiusMeters:
          target.uncertaintyRadiusMeters != null ? String(target.uncertaintyRadiusMeters) : "",
      },
    });
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundElement,
      color: theme.text,
      borderColor: theme.backgroundSelected,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Point My Yagi
        </ThemedText>
        <ThemedText themeColor="textSecondary">Enter a target to point at.</ThemedText>

        <View style={styles.toggleRow}>
          <ModeButton
            label="Coordinates"
            active={mode === "coordinates"}
            onPress={() => setMode("coordinates")}
          />
          <ModeButton label="Grid" active={mode === "grid"} onPress={() => setMode("grid")} />
        </View>

        {mode === "coordinates" ? (
          <>
            <Field label="Latitude">
              <TextInput
                style={inputStyle}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="41.7292"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                inputMode="text"
              />
            </Field>
            <Field label="Longitude">
              <TextInput
                style={inputStyle}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="-72.7083"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                inputMode="text"
              />
            </Field>
          </>
        ) : (
          <Field label="Maidenhead locator">
            <TextInput
              style={inputStyle}
              value={grid}
              onChangeText={setGrid}
              placeholder="FN31pr"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </Field>
        )}

        <Field label="Name (optional)">
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="W1ABC repeater"
            placeholderTextColor={theme.textSecondary}
            autoCorrect={false}
          />
        </Field>

        {error ? (
          <ThemedText style={[styles.error, { color: "#D5361B" }]}>{error}</ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.submit,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <ThemedText style={[styles.submitLabel, { color: theme.background }]}>
            Point at target
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/pota")}
          style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText type="link" themeColor="textSecondary">
            Browse POTA spots (experimental)
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.modeButton,
        { backgroundColor: active ? theme.backgroundSelected : theme.backgroundElement },
      ]}
    >
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  title: { marginBottom: Spacing.one },
  toggleRow: { flexDirection: "row", gap: Spacing.two },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: "center",
  },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 20,
  },
  error: { fontWeight: "700" },
  submit: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: "center",
  },
  submitLabel: { fontSize: 20, fontWeight: "700" },
  secondary: { alignItems: "center", paddingVertical: Spacing.two },
});
