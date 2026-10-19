import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', name: 'ReviewOverlay', formats: ['iife'], fileName: () => 'overlay.js' },
    minify: true,
    sourcemap: true
  },
  test: { environment: 'jsdom' }
});
