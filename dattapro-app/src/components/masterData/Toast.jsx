import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';

/**
 * Imperative toast stack.
 * Usage:
 *   const toastRef = useRef();
 *   toastRef.current.show({ type: 'success', message: '...' });
 *
 * Types: 'success' | 'error'
 * Auto-dismisses after 3 s. Max 3 visible at once.
 */
const Toast = forwardRef((_, ref) => {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useImperativeHandle(ref, () => ({
        show({ type = 'success', message }) {
            const id = Date.now() + Math.random();
            setToasts((prev) => {
                const next = [...prev, { id, type, message }];
                return next.slice(-3); // keep max 3
            });
            setTimeout(() => dismiss(id), 3000);
        },
    }));

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium max-w-sm
                        animate-[slideInRight_0.25s_ease-out]
                        ${t.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800/40 dark:text-emerald-300'
                            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800/40 dark:text-red-300'
                        }`}
                >
                    {/* Icon */}
                    {t.type === 'success' ? (
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    )}

                    {/* Message */}
                    <span className="flex-1 leading-snug">{t.message}</span>

                    {/* Close */}
                    <button
                        onClick={() => dismiss(t.id)}
                        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="Cerrar notificación"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
});

Toast.displayName = 'Toast';
export default Toast;
