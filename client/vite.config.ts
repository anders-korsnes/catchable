import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api/* to Express in dev so cookies share the localhost origin.
// Same prefix in prod so any reverse proxy can forward /api to the API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Don't silently bump ports — a mismatch breaks HMR (the browser keeps
    // reconnecting to 5173 while the page was served from 5174).
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
