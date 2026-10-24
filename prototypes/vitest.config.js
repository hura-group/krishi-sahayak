/**
 * vitest.config.js  (project root)
 *
 * Vitest configuration for the Gamification test suite.
 * Run all tests:          npx vitest
 * Run unit tests only:    npx vitest run --reporter=verbose src/features/Gamification/__tests__/unit
 * Run integration tests:  npx vitest run src/features/Gamification/__tests__/integration
 * Coverage:               npx vitest run --coverage
 */

import { defineConfig } from "vitest/config";
import react            from "@vitejs/plugin-react";
import path             from "path";

export default defineConfig({
  plugins: [react()],

  test: {
    // Use jsdom so React hooks render correctly in unit tests
    environment: "jsdom",

    // Make vi, describe, it, expect etc. available without imports
    globals: true,

    // Global setup runs once before the entire suite
    globalSetup: "./src/features/Gamification/__tests__/globalSetup.js",

    // Per-file setup runs before each test file
    setupFiles: ["./src/features/Gamification/__tests__/setup.js"],

    // Separate timeouts for unit vs integration
    testTimeout:  10_000,  // 10 s (integration tests hit real DB)
    hookTimeout:  15_000,

    // File matching
    include: ["src/**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["node_modules", "dist"],

    // Coverage configuration
    coverage: {
      provider:  "v8",
      reporter:  ["text", "lcov", "html"],
      include:   ["src/features/Gamification/**/*.{js,jsx}"],
      exclude:   [
        "src/features/Gamification/__tests__/**",
        "**/*.test.{js,jsx}",
      ],
      thresholds: {
        lines:      80,
        functions:  80,
        branches:   75,
        statements: 80,
      },
    },

    // Custom reporters for CI
    reporters: process.env.CI
      ? ["verbose", "junit"]
      : ["verbose"],

    outputFile: {
      junit: "./test-results/junit.xml",
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
