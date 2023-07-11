/// <reference types="vitest" />

import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  test: {
    env: {
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/postgres",
    },
  },
});
