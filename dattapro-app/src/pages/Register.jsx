import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import logoDattapro from '../assets/brand/logo-app.png';

const Register = () => {
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        correoInstitucional: '',
        password: '',
        confirmPassword: '',
        autorizaDatos: '' // Nuevo campo
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        setErrors({});

        const tempErrors = {};

        if (!formData.nombres.trim()) {
            tempErrors.nombres = 'Nombres es requerido';
        }
        if (!formData.apellidos.trim()) {
            tempErrors.apellidos = 'Apellidos es requerido';
        }
        if (!formData.correoInstitucional.trim()) {
            tempErrors.correoInstitucional = 'Correo institucional es requerido';
        } else if (!formData.correoInstitucional.endsWith('@unisimon.edu.co')) {
            tempErrors.correoInstitucional = 'El correo debe terminar en @unisimon.edu.co';
        }
        if (!formData.password) {
            tempErrors.password = 'La contraseña es requerida';
        } else {
            const passwordRegex = /^(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                tempErrors.password = 'La contraseña debe tener al menos 8 caracteres, incluyendo números y símbolos';
            }
        }
        if (!formData.confirmPassword) {
            tempErrors.confirmPassword = 'Confirmar contraseña es requerido';
        } else if (formData.password !== formData.confirmPassword) {
            tempErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        if (Object.keys(tempErrors).length > 0) {
            setErrors(tempErrors);
            setIsLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...dataToSend } = formData;
            const response = await fetch(`${API_BASE_URL}/usuarios/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            if (response.status === 201) {
                // Registro exitoso
                navigate('/login', { state: { message: '¡Cuenta creada con éxito! Por favor, inicia sesión.' } });
            } else if (response.status === 409) {
                // Conflicto: correo ya existe
                setErrorMessage('El correo institucional ya está registrado.');
            } else {
                setErrorMessage('Error al registrar la cuenta. Por favor, inténtalo de nuevo.');
            }
        } catch (error) {
            setErrorMessage('Error de conexión. Verifica que el servidor esté en ejecución.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="flex min-h-screen items-center justify-center p-6 sm:p-12">
                {/* Main Content Area */}
                <main className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-64 h-64">
                            <path d="M12 2L2 7l10 5l10-5l-10-5zM2 17l10 5l10-5M2 12l10 5l10-5" />
                        </svg>
                    </div>

                    <div className="relative z-10 w-full">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-3 mb-10">
                            <div className="size-10">
                                <img src={logoDattapro} alt="Logo Dattapro" className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-2xl font-normal tracking-tight text-slate-900 dark:text-white font-montserrat">
                                <span className="font-bold">Datta</span>pro
                            </h2>
                        </div>

                        {/* Header */}
                        <div className="mb-10 text-center">
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">Crea tu cuenta</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg">Comienza tu viaje en la red Unisimón de investigadores.</p>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-800/50 mb-6 text-sm font-medium text-center">
                                {errorMessage}
                            </div>
                        )}

                        {/* Form Section */}
                        <div className="space-y-6">
                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Nombres</label>
                                        <input
                                            className={`w-full px-5 py-4 rounded-2xl border ${errors.nombres ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-100 dark:border-slate-800'} bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400`}
                                            placeholder="Ej. Marie"
                                            type="text"
                                            name="nombres"
                                            value={formData.nombres}
                                            onChange={handleChange}
                                        />
                                        {errors.nombres && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.nombres}</span>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Apellidos</label>
                                        <input
                                            className={`w-full px-5 py-4 rounded-2xl border ${errors.apellidos ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-100 dark:border-slate-800'} bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400`}
                                            placeholder="Ej. Curie"
                                            type="text"
                                            name="apellidos"
                                            value={formData.apellidos}
                                            onChange={handleChange}
                                        />
                                        {errors.apellidos && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.apellidos}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Correo Institucional</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                <polyline points="22,6 12,13 2,6" />
                                            </svg>
                                        </div>
                                        <input
                                            className={`w-full pl-12 pr-5 py-4 rounded-2xl border ${errors.correoInstitucional ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-100 dark:border-slate-800'} bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400`}
                                            placeholder="nombre@unisimon.edu.co"
                                            type="email"
                                            name="correoInstitucional"
                                            value={formData.correoInstitucional}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {errors.correoInstitucional && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.correoInstitucional}</span>}
                                    <p className="text-xs font-medium text-red-500 ml-1 mt-1 flex items-center gap-1">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        Solo correos institucionales de la Universidad Simón Bolívar (@unisimon.edu.co)
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Contraseña</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </div>
                                        <input
                                            className={`w-full pl-12 pr-12 py-4 rounded-2xl border ${errors.password ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-100 dark:border-slate-800'} bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400`}
                                            placeholder="Crea una contraseña segura"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.password}</span>}
                                    <p className="text-xs text-slate-400 ml-1 mt-1">Al menos 8 caracteres, incluyendo números y símbolos.</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Confirmar Contraseña</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </div>
                                        <input
                                            className={`w-full pl-12 pr-12 py-4 rounded-2xl border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-100 dark:border-slate-800'} bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400`}
                                            placeholder="Confirma tu contraseña"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                        >
                                            {showConfirmPassword ? (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.confirmPassword}</span>}
                                </div>

                                {/* Autorización de Datos (Pregunta 2) */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] transition-all hover:border-primary/30">
                                    <label className="block text-sm text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                                        Al realizar el registro, autorizo de manera previa, expresa e informada a la Universidad Simón Bolívar para el tratamiento de mis datos personales, conforme a la Política de Tratamiento de Datos Personales institucional, la cual he leído y acepto. Declaro conocer mis derechos como titular de la información, de conformidad con la Ley 1581 de 2012 y demás normas concordantes. Consulte la política{' '}
                                        <a href="https://barranquillas.unisimon.edu.co/web/index.php/showimagen/showpdf/centrodocumentos/20230428113507_0.pdf?utm_source=chatgpt.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">aquí</a>.
                                    </label>
                                    <label className="block text-sm text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                                        ¿Autoriza el tratamiento de sus datos personales bajo las políticas institucionales?
                                    </label>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex-1 min-w-[120px] relative cursor-pointer">
                                            <input
                                                type="radio"
                                                name="autorizaDatos"
                                                value="true"
                                                checked={formData.autorizaDatos === 'true'}
                                                onChange={handleChange}
                                                className="peer sr-only"
                                            />
                                            <div className="px-5 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex items-center justify-between group">
                                                <span className="font-bold text-sm text-slate-600 dark:text-slate-400 peer-checked:text-primary">Sí, autorizo</span>
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 peer-checked:border-primary flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 bg-primary rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                                </div>
                                            </div>
                                        </label>
                                        <label className="flex-1 min-w-[120px] relative cursor-pointer">
                                            <input
                                                type="radio"
                                                name="autorizaDatos"
                                                value="false"
                                                checked={formData.autorizaDatos === 'false'}
                                                onChange={handleChange}
                                                className="peer sr-only"
                                            />
                                            <div className="px-5 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex items-center justify-between group">
                                                <span className="font-bold text-sm text-slate-600 dark:text-slate-400 peer-checked:text-primary">No autorizo</span>
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 peer-checked:border-primary flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 bg-primary rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <p className="text-sm text-slate-500 font-medium order-2 sm:order-1">
                                        ¿Ya tienes una cuenta?{' '}
                                        <Link to="/login" className="text-primary font-bold hover:underline">Inicia sesión</Link>
                                    </p>
                                    <button
                                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98] order-1 sm:order-2"
                                        type="submit"
                                        disabled={isLoading || formData.autorizaDatos !== 'true'}
                                    >
                                        {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                                        {!isLoading && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Register;
