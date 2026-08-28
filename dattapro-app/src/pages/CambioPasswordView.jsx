import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { toast } from 'sonner';
import Select from 'react-select';
import { Eye, EyeOff, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CambioPasswordView = () => {
    const { user, role, isAdmin, token } = useAuth();
    
    // Validación de rol estricta para administrador
    const isUserAdmin = role && (
        String(role).toLowerCase() === 'admin' || 
        String(role).toLowerCase() === 'role_admin'
    );

    // Form states
    const [formData, setFormData] = useState({
        passwordActual: '',
        passwordNueva: '',
        confirmacionPassword: ''
    });

    // UI states
    const [showPasswords, setShowPasswords] = useState({
        actual: false,
        nueva: false,
        confirmacion: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);

    // Fetch users if admin
    useEffect(() => {
        if (isUserAdmin) {
            fetchUsers();
        }
    }, [isUserAdmin]);

    const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
            const cleanToken = (token || localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${cleanToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            
            const options = data.map(u => ({
                value: u.id,
                label: `${u.nombres} ${u.apellidos} (${u.correoInstitucional})`,
                email: u.correoInstitucional
            }));
            setUsers(options);
        } catch (error) {
            toast.error('No se pudieron cargar los usuarios');
        } finally {
            setIsFetchingUsers(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (formData.passwordNueva !== formData.confirmacionPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }

        if (formData.passwordNueva.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Si no es admin y no hay password actual
        if (!selectedUser && !formData.passwordActual) {
            toast.error('Debes ingresar tu contraseña actual');
            return;
        }

        setIsLoading(true);

        try {
            const cleanToken = (token || localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
            let endpoint = '';
            let method = '';
            
            const body = {
                passwordNueva: formData.passwordNueva,
                confirmacionPassword: formData.confirmacionPassword
            };

            if (selectedUser) {
                // Modo Administrador
                method = 'POST';
                endpoint = `${API_BASE_URL}/usuarios/admin/reset-password?email=${encodeURIComponent(selectedUser.email)}`;
            } else {
                // Modo Usuario Normal
                method = 'PUT';
                endpoint = `${API_BASE_URL}/usuarios/me/password`;
                body.passwordActual = formData.passwordActual;
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cleanToken}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al procesar la solicitud');
            }

            toast.success(selectedUser 
                ? `Contraseña restablecida para ${selectedUser.email}` 
                : 'Tu contraseña ha sido actualizada correctamente');
            
            // Clear form
            setFormData({
                passwordActual: '',
                passwordNueva: '',
                confirmacionPassword: ''
            });
            if (selectedUser) setSelectedUser(null);

        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user && !isUserAdmin) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-slate-500 font-medium">Cargando sesión...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full p-4 md:p-8 bg-slate-50 dark:bg-slate-900 flex justify-center items-start lg:items-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="flex flex-col lg:flex-row">
                    {/* Sidebar / Decoration */}
                    <div className="lg:w-1/3 bg-primary p-8 lg:p-10 flex flex-col justify-between text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30">
                                <ShieldCheck className="size-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-black leading-tight mb-2">Seguridad de la Cuenta</h1>
                            <p className="text-white/70 text-sm font-medium">
                                Protege tu acceso y mantén tu información investigativa segura.
                            </p>
                        </div>

                        <div className="mt-12 lg:mt-0 relative z-10">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                                <div className="h-px w-8 bg-white/20"></div>
                                Dattapro Security
                            </div>
                        </div>

                        {/* Abstract background shapes */}
                        <div className="absolute -bottom-20 -right-20 size-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -top-10 -left-10 size-40 bg-sky-400/20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-8 lg:p-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Mode Indicator / Selector */}
                            {isUserAdmin && (
                                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                                        Modo de Gestión Administrativa
                                    </label>
                                    <Select
                                        options={users}
                                        value={selectedUser}
                                        onChange={setSelectedUser}
                                        placeholder="Seleccionar usuario para restablecer..."
                                        isLoading={isFetchingUsers}
                                        isClearable
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: '1rem',
                                                padding: '2px',
                                                backgroundColor: 'transparent',
                                                borderColor: 'var(--tw-slate-200)',
                                                '&:hover': { borderColor: 'var(--tw-primary)' }
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                borderRadius: '1rem',
                                                overflow: 'hidden',
                                                zIndex: 50
                                            })
                                        }}
                                    />
                                    <p className="mt-2 text-[11px] text-slate-500 px-1 italic">
                                        {selectedUser 
                                            ? `Estás restableciendo la contraseña de: ${selectedUser.email}`
                                            : 'Deja vacío para cambiar TU propia contraseña.'}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* Password Actual (Hidden if admin is resetting another user) */}
                                <AnimatePresence mode="wait">
                                    {!selectedUser && (
                                        <motion.div
                                            key="actual"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                                Contraseña Actual
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                                    <Lock className="size-4" />
                                                </div>
                                                <input
                                                    type={showPasswords.actual ? "text" : "password"}
                                                    name="passwordActual"
                                                    value={formData.passwordActual}
                                                    onChange={handleChange}
                                                    placeholder="••••••••"
                                                    className="w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-slate-900 dark:text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => toggleShowPassword('actual')}
                                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    {showPasswords.actual ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Password Nueva */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                        Nueva Contraseña
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <input
                                            type={showPasswords.nueva ? "text" : "password"}
                                            name="passwordNueva"
                                            value={formData.passwordNueva}
                                            onChange={handleChange}
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                            className="w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-slate-900 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowPassword('nueva')}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showPasswords.nueva ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirmacion Password */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <input
                                            type={showPasswords.confirmacion ? "text" : "password"}
                                            name="confirmacionPassword"
                                            value={formData.confirmacionPassword}
                                            onChange={handleChange}
                                            placeholder="Repite la nueva contraseña"
                                            required
                                            className="w-full pl-11 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium text-slate-900 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowPassword('confirmacion')}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            {showPasswords.confirmacion ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="size-5 animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{selectedUser ? 'Restablecer Contraseña' : 'Actualizar Contraseña'}</span>
                                            <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CambioPasswordView;
