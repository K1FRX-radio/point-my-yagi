import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExternalLink } from "@/components/external-link";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { featureFlags } from "@/config/feature-flags";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function RepeaterBookScreen() {
  const theme = useTheme();
  const enabled = featureFlags.repeaterBook;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">{enabled ? "EXPERIMENTAL" : "PENDING APPROVAL"}</ThemedText>
        </View>

        <ThemedText type="subtitle">RepeaterBook</ThemedText>

        <ThemedText themeColor="textSecondary">
          RepeaterBook’s API requires application approval before any live data can be used. This
          feature is disabled in this build until approval is granted.
        </ThemedText>

        <ThemedText themeColor="textSecondary">
          When enabled, you will link your own RepeaterBook token (generated from your RepeaterBook
          account) and it will be stored securely on this device only. The app never ships a shared
          token.
        </ThemedText>

        <View style={styles.attribution}>
          <ThemedText type="small" themeColor="textSecondary">
            Data courtesy of RepeaterBook.com
          </ThemedText>
          <ExternalLink href="https://www.repeaterbook.com">
            <ThemedText type="linkPrimary">repeaterbook.com</ThemedText>
          </ExternalLink>
        </View>
      </SafeAreaView>
    </ThemedView>
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
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  attribution: { marginTop: Spacing.two, gap: Spacing.one },
});
