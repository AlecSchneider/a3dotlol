import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Next preserves JSX for its own compiler; tests must lower imported TSX.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "~": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
    environment: "edge-runtime",
  },
});
