import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ── PM Media endpoints live on the PM service (port 8086) ──────────
      // The PM service has context-path=/api, so the real path on 8086 is
      // /api/api/pm/media/... — rewrite prepends the extra /api prefix.
      '/api/pm/media': {
        target: 'http://localhost:8086',
        changeOrigin: true,
        rewrite: (path) => '/api' + path,   // /api/pm/media/... → /api/api/pm/media/...
      },
      // ── Everything else goes through the API gateway ────────────────────
      '/api': { target: 'http://localhost:8081', changeOrigin: true },
    '/admin/users':         { target: 'http://localhost:8081', changeOrigin: true },
      '/admin/pending-users': { target: 'http://localhost:8081', changeOrigin: true },
      '/admin/approve-user':  { target: 'http://localhost:8081', changeOrigin: true },
      '/admin/reject-user':   { target: 'http://localhost:8081', changeOrigin: true },
      '/admin/audit-logs':    { target: 'http://localhost:8081', changeOrigin: true },
      '/users':         { target: 'http://localhost:8081', changeOrigin: true },
      '/notifications': { target: 'http://localhost:8081', changeOrigin: true },
    },
  },
})