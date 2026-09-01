import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // loadEnv reads frontend/.env* (not exposed via import.meta.env here -
  // this file runs in Node, not the browser bundle). VITE_BACKEND_PORT lets
  // local dev point the proxy at whatever port the backend's own .env uses
  // (see backend/.env's PORT), instead of assuming a fixed port that can
  // silently drift out of sync.
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.VITE_BACKEND_PORT || 3001

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // The backend now mounts all routes under /api itself, so this just
        // forwards as-is (no rewrite) - same path in dev and production.
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  }
})
