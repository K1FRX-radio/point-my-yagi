import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const SEEN_KEY = "pmy.onboarding.orientationTip.v1";

function useFirstRunTip() {
  const [show, setShow] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const check = async () => {
      try {
        const seen = await AsyncStorage.getItem(SEEN_KEY);
        if (isMounted.current && !seen) {
          setShow(true);
        }
      } catch {
        // ignore: skip the tip on storage error
      }
    };
    void check();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    AsyncStorage.setItem(SEEN_KEY, "1").catch(() => {});
  }, []);

  return { show, dismiss };
}

/** One-time modal explaining phone orientation and compass interference. */
export function FirstRunTip() {
  const theme = useTheme();
  const { show, dismiss } = useFirstRunTip();

  return (
    <Modal visible={show} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Before you point</ThemedText>
          <ThemedText themeColor="textSecondary">
            Hold the phone flat with its top edge along the antenna boom, pointing toward the
            directors.
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Keep the phone away from metal. The antenna, radio, battery, tripod, vehicles, and
            buildings can skew the compass. If the reading looks off, move away from metal or use
            the bearing-only fallback.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={dismiss}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText style={[styles.buttonLabel, { color: theme.background }]}>
              Got it
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.four,
  },
  card: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.three },
  button: {
    marginTop: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: "center",
  },
  buttonLabel: { fontSize: 18, fontWeight: "700" },
});
