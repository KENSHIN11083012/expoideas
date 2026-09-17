import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fuentes empaquetadas con la app: no dependen de Google Fonts en tiempo de ejecucion.
import '@fontsource-variable/inter'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ className: 'font-sans' }}
      />
    </AuthProvider>
  </StrictMode>,
)
