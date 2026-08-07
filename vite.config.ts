import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: [reactCompilerPreset()],
        plugins: [babel()],
      },
    }),
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