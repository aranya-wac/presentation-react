import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Static media served by the FastAPI app — backdrops, AI-generated
      // images, seed previews, imported PPTX slide images. Without these
      // proxy entries the editor renders broken <img> placeholders.
      '/imports':   { target: 'http://localhost:8000', changeOrigin: true },
      '/generated': { target: 'http://localhost:8000', changeOrigin: true },
      '/previews':  { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
