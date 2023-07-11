/// <reference types="vitest" />

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    env: {
      DATABASE_PORT: "5432",
      DATABASE_HOST: "localhost",
      DATABASE_NAME: "postgres",
      DATABASE_USER: "postgres",
      DATABASE_PASSWORD: "postgres",
    },
    inspect: true,
    singleThread: true,
  },
});
