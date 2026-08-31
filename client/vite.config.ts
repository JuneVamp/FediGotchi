import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3251',
        changeOrigin: true,
      },
      '/current-user': {
        target: 'http://localhost:3251',
        changeOrigin: true,
      },
      '/pets': {
        target: 'http://localhost:3251',
        changeOrigin: true,
      },
      '/environments': {
        target: 'http://localhost:3251',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
