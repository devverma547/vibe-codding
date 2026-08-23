import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/framer-motion/')) {
            return 'vendor-framer';
          }
          if (normalized.includes('/node_modules/lucide-react/')) {
            return 'vendor-lucide';
          }
          if (normalized.includes('/node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          if (normalized.includes('/node_modules/firebase/')) {
            return 'vendor-firebase';
          }
          if (normalized.includes('/node_modules/recharts/')) {
            return 'vendor-recharts';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true
  }
})
