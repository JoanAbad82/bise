// src/ds · the gallery's own Vite config (pnpm gallery = vite src/ds/gallery): kept out of the app's
// build. The '@' alias matches the app's (src/).
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: __dirname,
  base: "./",
  resolve: { alias: { "@": resolve(__dirname, "../..") } },
  plugins: [react()],
});
