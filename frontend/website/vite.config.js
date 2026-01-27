import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: resolve(__dirname, '../../backend/static'),
    sourcemap: false
  },
  plugins: [react()],
})
