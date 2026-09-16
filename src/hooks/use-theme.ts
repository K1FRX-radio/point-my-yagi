/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, HighContrastColors } from "@/constants/theme";
import { usePreferences } from "@/features/preferences/preferences-provider";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === "unspecified" ? "light" : scheme;
  const { preferences } = usePreferences();

  return preferences.highContrast ? HighContrastColors[theme] : Colors[theme];
}
