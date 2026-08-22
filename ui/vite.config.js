import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Das Backend hängt in Produktion hinter nginx unter /server/ (siehe conf.d/nginx.conf).
// Der Dev-Proxy spiegelt genau diese Regel, damit der API-Pfad in Dev und Prod identisch ist.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/server': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/server/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
