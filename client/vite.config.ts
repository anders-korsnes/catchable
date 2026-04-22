import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite proxies /api/* to the Express server in dev so cookies "just work" on the
// same origin (localhost). In production the same prefix is used so the client
// can be served behind any reverse proxy that forwards /api to the API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Refuse to silently bump to 5174/5175/etc. when 5173 is busy: a port
    // mismatch breaks HMR (the browser keeps trying to WebSocket back to 5173
    // even though the page was actually served from 5174). Crashing up-front
    // makes the port conflict visible immediately.
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
