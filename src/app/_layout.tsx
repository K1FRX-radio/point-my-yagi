import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import { PreferencesProvider } from "@/features/preferences/preferences-provider";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <PreferencesProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="pointing" options={{ title: "Pointing" }} />
          <Stack.Screen name="pota" options={{ title: "POTA spots" }} />
          <Stack.Screen name="repeaterbook" options={{ title: "RepeaterBook" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="targets" options={{ title: "Favorites & recent" }} />
        </Stack>
      </ThemeProvider>
    </PreferencesProvider>
  );
}
