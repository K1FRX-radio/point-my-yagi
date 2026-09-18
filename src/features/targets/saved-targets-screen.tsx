import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { SavedTarget } from "@/domain";
import { resolveSavedTarget } from "@/features/targets/resolve-saved-target";
import { pointingHref } from "@/features/targets/target-params";
import { useTargetLists } from "@/features/targets/use-target-lists";
import { useTheme } from "@/hooks/use-theme";

export function SavedTargetsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { favorites, recents, isFavorite, toggleFavorite } = useTargetLists();
  const [busyId, setBusyId] = useState<string | null>(null);

  const openTarget = useCallback(
    async (saved: SavedTarget) => {
      setBusyId(saved.id);
      try {
        const result = await resolveSavedTarget(saved);
        if (result.ok) {
          router.push(pointingHref(result.value));
        } else {
          Alert.alert("Can\u2019t open target", result.error.message);
        }
      } finally {
        setBusyId(null);
      }
    },
    [router],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Section title="Favorites" empty="No favorites yet. Tap the star on the pointing screen.">
            {favorites.map((target) => (
              <TargetRow
                key={target.id}
                target={target}
                favorite
                busy={busyId === target.id}
                theme={theme}
                onOpen={() => openTarget(target)}
                onToggleFavorite={() => toggleFavorite(target)}
              />
            ))}
          </Section>

          <Section title="Recent" empty="Targets you point at will appear here.">
            {recents.map((target) => (
              <TargetRow
                key={target.id}
                target={target}
                favorite={isFavorite(target.id)}
                busy={busyId === target.id}
                theme={theme}
                onOpen={() => openTarget(target)}
                onToggleFavorite={() => toggleFavorite(target)}
              />
            ))}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {empty}
        </ThemedText>
      ) : (
        children
      )}
    </View>
  );
}

function TargetRow({
  target,
  favorite,
  busy,
  theme,
  onOpen,
  onToggleFavorite,
}: {
  target: SavedTarget;
  favorite: boolean;
  busy: boolean;
  theme: ReturnType<typeof useTheme>;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      disabled={busy}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, opacity: pressed || busy ? 0.7 : 1 },
      ]}
    >
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{target.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {target.sourceLabel}
        </ThemedText>
      </View>
      {busy ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? "Remove favorite" : "Add favorite"}
          onPress={onToggleFavorite}
          hitSlop={10}
        >
          <ThemedText style={styles.star}>{favorite ? "\u2605" : "\u2606"}</ThemedText>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.four },
  section: { gap: Spacing.two },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  rowText: { flex: 1, gap: Spacing.half },
  star: { fontSize: 24, lineHeight: 28 },
});
