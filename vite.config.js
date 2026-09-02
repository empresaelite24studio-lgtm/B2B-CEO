import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    // No sourcemaps en producción (reduce tamaño del bundle)
    sourcemap: false,
    // Inlinea assets menores a 4KB directamente en HTML
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // Divide vendors en chunks separados para mejor caché (función requerida por Rolldown/Vite 8)
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion-vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
        }
      }
    }
  }
})
