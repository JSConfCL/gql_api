/// <reference types="vitest" />

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import dotenv from "dotenv";

dotenv.config({
  path: process.cwd() + "/.test.vars",
  override: true,
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
});
