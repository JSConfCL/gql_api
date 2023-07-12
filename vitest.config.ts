/// <reference types="vitest" />

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    inspect: true,
    testTimeout: 10000,
    singleThread: true,
  },
});
