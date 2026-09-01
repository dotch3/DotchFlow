import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // The backend now mounts all routes under /api itself, so this just
      // forwards as-is (no rewrite) - same path in dev and production.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
