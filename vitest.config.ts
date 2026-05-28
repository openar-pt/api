import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./vitest.globalSetup.ts",
    testTimeout: 15_000,
    hookTimeout: 15_000,
    reporters: ["verbose"],
  },
});
