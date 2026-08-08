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

  build: {
    chunkSizeWarningLimit: 1000, // raise warning limit to 1000kB
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Suppress EVAL warnings coming from third-party libraries (e.g. lottie-web)
        if (warning.code === 'EVAL') return;
        defaultHandler(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify') || id.includes('purify')) {
              return 'vendor-pdf';
            }
            if (id.includes('lottie-web') || id.includes('lottie-react')) {
              return 'vendor-lottie';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            return 'vendor-core'; // generic core node_modules
          }
        }
      }
    }
  }
})