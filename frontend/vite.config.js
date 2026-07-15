import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/chart/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
