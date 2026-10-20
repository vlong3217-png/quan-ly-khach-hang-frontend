import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const defaultUrl = mode === 'development' ? 'http://127.0.0.1:8000' : 'https://quan-ly-khach-hang-backend.onrender.com'
  const apiUrl =
    env.VITE_API_URL ||
    process.env.VITE_API_URL ||
    defaultUrl

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  }
})
