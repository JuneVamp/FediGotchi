import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  base: '/FediGotchi/',
  // server: {
  //   host: '0.0.0.0',
  //   port: 5173,
  // }
});
