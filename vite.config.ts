import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * CHRONOS OSS - VITE CONFIG (A2.4)
 */

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});
