import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        nutrition: resolve(__dirname, 'src/nutrition/index.html'),
        dashboard: resolve(__dirname, 'src/dashboard/index.html'),
      },
    },
  },
});
