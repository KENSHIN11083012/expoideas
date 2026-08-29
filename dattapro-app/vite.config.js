import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El subdirectorio donde se sirve la app. App.jsx lo reutiliza como basename
// del router via import.meta.env.BASE_URL, para no mantenerlo en dos sitios.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_PATH || '/expoideas/',
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
