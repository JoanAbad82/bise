// The build of bise desktop: three bundles from one config (electron-vite).
//   main      src/main/index.ts     Electron's main process (amb-mac; src/main/core is amb-core's)
//   preload   src/main/preload.ts   the only bridge to the renderer (contextBridge, sandboxed: CommonJS)
//   renderer  src/renderer/         the React app (index.html + main.tsx mount src/app)
// Output goes to out/ (git-ignored); `pnpm start` runs the built app.
import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

const src = resolve(__dirname, 'src');

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: { index: resolve(src, 'main/index.ts') } },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: resolve(src, 'main/preload.ts') },
        output: { format: 'cjs' },
      },
    },
  },
  renderer: {
    root: resolve(src, 'renderer'),
    resolve: { alias: { '@': src } },
    plugins: [react()],
    build: {
      rollupOptions: { input: { index: resolve(src, 'renderer/index.html') } },
    },
  },
});
