import { defineConfig } from 'vite';

// No extra plugins needed: shaders are imported with Vite's built-in
// `?raw` suffix (see src/scene/CityMesh.js), and Web Workers are
// imported with the built-in `?worker` suffix.
export default defineConfig({
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
