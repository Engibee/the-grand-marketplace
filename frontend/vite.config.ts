import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from project root
  const env = loadEnv(mode, resolve(process.cwd(), '..'), '')

  return {
    plugins: [react()],
    define: {
      // Expose environment variables to the frontend
      __BACKEND_PORT__: JSON.stringify(env.BACKEND_PORT || '3001'),
      __FRONTEND_PORT__: JSON.stringify(env.FRONTEND_PORT || '5173'),
      __API_URL__: JSON.stringify(env.API_URL || `http://localhost:${env.BACKEND_PORT || 3001}`),
    },
    server: {
      port: parseInt(env.FRONTEND_PORT || '5173'),
    },
  }
})
