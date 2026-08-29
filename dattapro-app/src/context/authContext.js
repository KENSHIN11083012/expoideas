import { createContext } from 'react';

/**
 * Vive en su propio modulo, sin componentes: si el contexto y el provider
 * comparten archivo, Fast Refresh deja de funcionar en ese archivo.
 */
export const AuthContext = createContext(null);
