import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { bandForMhz, greatCircleDistanceMeters, type Target } from "@/domain";
import { useWorkedToday } from "@/features/contacts/use-worked-today";
import { useForegroundLocation } from "@/features/location/use-foreground-location";
import { usePotaSpots } from "@/features/pota/use-pota-spots";
import { useTheme } from "@/hooks/use-theme";
import { filterTargets } from "@/sources";

const METERS_PER_MILE = 1609.344;
const CAUTION_COLOR = "#C7791B";
const WORKED_COLOR = "#12A150";
const BAND_ORDER = [
  "160m",
  "80m",
  "60m",
  "40m",
  "30m",
  "20m",
  "17m",
  "15m",
  "12m",
  "10m",
  "6m",
  "2m",
  "1.25m",
  "70cm",
];
const COMMON_MODES = ["SSB", "USB", "LSB", "CW", "FM", "AM", "FT8", "FT4", "RTTY"];

interface Row {
  target: Target;
  distanceMeters: number | null;
}

const EMPTY_TARGETS: Target[] = [];
function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km < 1
    ? `${Math.round(meters)} m`
    : `${km.toFixed(0)} km / ${(meters / METERS_PER_MILE).toFixed(0)} mi`;
}

function formatAge(
  observedAt: number | undefined,
  nowMs: number,
): { text: string; stale: boolean } {
  if (observedAt == null) {
    return { text: "time unknown", stale: true };
  }
  const minutes = Math.max(0, Math.round((nowMs - observedAt) / 60000));
  return { text: minutes < 1 ? "just now" : `${minutes} min ago`, stale: minutes >= 15 };
}

function distinctBands(targets: Target[]): string[] {
  const present = new Set<string>();
  for (const t of targets) {
    const band = bandForMhz(t.frequencyMhz);
    if (band) present.add(band);
  }
  // Keep every band selectable, but surface present bands first.
  const ordered = BAND_ORDER.filter((b) => present.has(b));
  const rest = BAND_ORDER.filter((b) => !present.has(b));
  return [...ordered, ...rest];
}

function distinctModes(targets: Target[]): string[] {
  const present = new Set<string>();
  for (const t of targets) {
    if (t.mode) present.add(t.mode.toUpperCase());
  }
  // Common modes are always offered; any extra present modes follow.
  const extras = [...present].filter((m) => !COMMON_MODES.includes(m)).sort();
  return [...COMMON_MODES, ...extras];
}

export function PotaScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { state: locationState } = useForegroundLocation();
  const { state, refresh } = usePotaSpots();

  const [text, setText] = useState("");
  const [region, setRegion] = useState("");
  const [band, setBand] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [hideWorked, setHideWorked] = useState(false);

  const worked = useWorkedToday();
  const { isWorked, toggle: toggleWorked } = worked;

  const near = useMemo(
    () =>
      locationState.status === "ready"
        ? { latitude: locationState.latitude, longitude: locationState.longitude }
        : null,
    [locationState],
  );

  const targets = useMemo(
    () => (state.status === "ready" ? state.targets : EMPTY_TARGETS),
    [state],
  );
  const referenceMs = state.status === "ready" ? state.loadedAt : 0;

  const bands = useMemo(() => distinctBands(targets), [targets]);
  const modes = useMemo(() => distinctModes(targets), [targets]);

  const rows = useMemo<Row[]>(() => {
    const filtered = filterTargets(targets, {
      text: text.trim() || undefined,
      region: region.trim() || undefined,
      band: band ?? undefined,
      mode: mode ?? undefined,
      near: near ?? undefined,
    });
    const visible =
      hideWorked && targets.length > 0
        ? filtered.filter(
            (t) => !(t.callsign && t.sourceRecordId && isWorked(t.callsign, t.sourceRecordId)),
          )
        : filtered;
    return visible.map((target) => ({
      target,
      distanceMeters: near ? greatCircleDistanceMeters(near, target) : null,
    }));
  }, [targets, text, region, band, mode, near, hideWorked, isWorked]);

  function openTarget(target: Target) {
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
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={[styles.experimentalBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">EXPERIMENTAL</ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={refresh}
              style={({ pressed }) => [
                styles.refresh,
                { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText style={[styles.refreshLabel, { color: theme.background }]}>
                Refresh
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.inputsRow}>
            <TextInput
              style={[inputStyle, styles.inputHalf]}
              value={text}
              onChangeText={setText}
              placeholder="Activator or park"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TextInput
              style={[inputStyle, styles.inputHalf]}
              value={region}
              onChangeText={setRegion}
              placeholder="Grid / region"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <ChipRow
            items={bands}
            selected={band}
            onSelect={setBand}
            allLabel="All bands"
            theme={theme}
          />
          <ChipRow
            items={modes}
            selected={mode}
            onSelect={setMode}
            allLabel="All modes"
            theme={theme}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: hideWorked }}
            onPress={() => setHideWorked((v) => !v)}
            style={[
              styles.hideWorked,
              { backgroundColor: hideWorked ? theme.text : theme.backgroundElement },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{ color: hideWorked ? theme.background : theme.text }}
            >
              {hideWorked ? "Hiding worked today" : "Hide worked today"}
              {worked.count > 0 ? ` (${worked.count})` : ""}
            </ThemedText>
          </Pressable>
        </View>

        {state.status === "loading" ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.text} />
            <ThemedText themeColor="textSecondary">Loading current spots…</ThemedText>
          </View>
        ) : state.status === "error" ? (
          <View style={styles.centered}>
            <ThemedText type="subtitle">Could not load spots</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {state.error.message}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => row.target.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const age = formatAge(item.target.observedAt, referenceMs);
              const itemBand = bandForMhz(item.target.frequencyMhz);
              const canMark = Boolean(item.target.callsign && item.target.sourceRecordId);
              const marked =
                canMark && isWorked(item.target.callsign!, item.target.sourceRecordId!);
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openTarget(item.target)}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <View style={styles.rowTop}>
                    <ThemedText type="smallBold" style={styles.rowName}>
                      {item.target.name}
                    </ThemedText>
                    {canMark ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: marked }}
                        onPress={() =>
                          toggleWorked(item.target.callsign!, item.target.sourceRecordId!)
                        }
                        hitSlop={8}
                        style={[
                          styles.workedPill,
                          {
                            backgroundColor: marked ? WORKED_COLOR : "transparent",
                            borderColor: marked ? WORKED_COLOR : theme.backgroundSelected,
                          },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={{ color: marked ? "#FFFFFF" : theme.textSecondary }}
                        >
                          {marked ? "Worked \u2713" : "Mark"}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {[
                      item.target.frequencyMhz
                        ? `${item.target.frequencyMhz.toFixed(3)} MHz`
                        : null,
                      item.target.mode,
                      itemBand,
                      item.target.adminRegion,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </ThemedText>
                  <View style={styles.rowMeta}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.distanceMeters != null
                        ? formatDistance(item.distanceMeters)
                        : "distance n/a"}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: age.stale ? CAUTION_COLOR : theme.textSecondary }}
                    >
                      {age.text}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText themeColor="textSecondary">No spots match your filters.</ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function ChipRow({
  items,
  selected,
  onSelect,
  allLabel,
  theme,
}: {
  items: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  allLabel: string;
  theme: ReturnType<typeof useTheme>;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      <Chip
        label={allLabel}
        active={selected == null}
        onPress={() => onSelect(null)}
        theme={theme}
      />
      {items.map((item) => (
        <Chip
          key={item}
          label={item}
          active={selected === item}
          onPress={() => onSelect(item)}
          theme={theme}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? theme.text : theme.backgroundElement }]}
    >
      <ThemedText type="smallBold" style={{ color: active ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  experimentalBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  refresh: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
  },
  refreshLabel: { fontSize: 16, fontWeight: "700" },
  inputsRow: { flexDirection: "row", gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inputHalf: { flex: 1 },
  chipRow: { gap: Spacing.one, paddingVertical: Spacing.half },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centerText: { textAlign: "center" },
  listContent: { padding: Spacing.four, gap: Spacing.two },
  row: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.half },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  rowName: { flex: 1 },
  workedPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  hideWorked: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    marginTop: Spacing.half,
  },
  rowMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.one },
});
