import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // The browser only ever talks to one origin, so the session cookie stays SameSite=Strict.
    proxy: { '/api': 'http://localhost:5080' },
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
  },
});
