import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('src/components', import.meta.url)),
      '@context': fileURLToPath(new URL('src/context', import.meta.url)),
      '@features': fileURLToPath(new URL('src/features', import.meta.url)),
      '@utils': fileURLToPath(new URL('src/utils', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})