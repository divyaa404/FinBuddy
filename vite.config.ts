import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    proxy: {
      '/grok-api': {
        target: 'https://api.x.ai/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grok-api/, ''),
        headers: {
          Origin: 'https://api.x.ai',
        },
      },
    },
  },
})