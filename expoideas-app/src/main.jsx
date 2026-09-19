import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
// Fuentes empaquetadas con la app: no dependen de Google Fonts en tiempo de ejecución.
import '@fontsource-variable/inter';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import App from '@/App';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { createQueryClient } from '@/lib/queryClient';

const queryClient = createQueryClient();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <App />
                <Toaster position="top-right" richColors closeButton toastOptions={{ className: 'font-sans' }} />
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
