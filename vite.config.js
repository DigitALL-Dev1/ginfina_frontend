import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://217.216.76.178:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: { port: 4174 },
  build: { sourcemap: true },
});
