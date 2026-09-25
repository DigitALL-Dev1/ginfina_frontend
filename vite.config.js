import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'https://ginfinabackend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 4174,
    proxy: {
      '/api': {
        target: 'https://ginfinabackend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: { sourcemap: true },
});
