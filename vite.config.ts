import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // data/export/ é servido na raiz: fetch("/index.json"), fetch("/eleicoes/tweets.json")
  publicDir: "data/export",
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/main.tsx", "src/types.ts", "src/**/*.test.*", "src/test/**"],
      reporter: [["text", { skipFull: false }], "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
