import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Without this, vitest also globs the compiled copies under dist/, running
    // every suite twice — the second time against possibly stale output.
    include: ["src/**/*.test.ts"],
    // Loads .env for local development; no-op when secrets are already injected.
    globalSetup: "./vitest.globalSetup.ts",
    testTimeout: 15_000,
    hookTimeout: 15_000,
    reporters: ["verbose"],
  },
});
