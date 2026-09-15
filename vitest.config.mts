import { defineConfig } from "vitest/config";

// Scoped to the pure, runtime-independent layers only. These modules must not
// import react-native or expo-* so they can run under Node without transforms.
export default defineConfig({
  test: {
    include: ["src/domain/**/*.test.ts", "src/sources/**/*.test.ts"],
    environment: "node",
  },
});
