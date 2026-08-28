import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { jwtDecode } from 'jwt-decode';
import fotoLogin from '../assets/brand/login-hero.jpeg';
import logoUnisimon from '../assets/brand/logo-unisimon-negro.png';
import logoDattapro from '../assets/brand/logo-app.png';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const location = useLocation();
    const successMsg = location.state?.message;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Credenciales inválidas');
            }

            const data = await response.json();

            if (data.token) {
                const decoded = jwtDecode(data.token);
                const exactRole = decoded.rol || decoded.role || decoded.roles || data.rol;

                // Normalizar rol a mayúsculas
                let roleToSave = String(exactRole).toUpperCase();
                if (roleToSave === 'PROFESOR') roleToSave = 'ROLE_PROFESOR';

                // Guardar token y datos en el contexto usando el rol del token
                login(data.token, { id: data.userId, email: data.email }, roleToSave);

                // Redirección condicional según el rol (insensible a mayúsculas/minúsculas)
                if (roleToSave === 'ROLE_ADMIN' || roleToSave === 'ADMIN') {
                    navigate('/admin');
                } else if (roleToSave === 'ROLE_PROFESOR' || roleToSave === 'PROFESOR') {
                    navigate('/');
                } else {
                    // Redirección por defecto para otros roles
                    navigate('/network');
                }
            } else {
                throw new Error('No se recibió el token de autenticación');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="flex min-h-screen">
                {/* Left Section: Login Form */}
                <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-24 bg-white dark:bg-background-dark">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="size-8">
                                <img src={logoDattapro} alt="Logo Dattapro" className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-xl font-normal tracking-tight text-slate-900 dark:text-slate-100 font-montserrat">
                                <span className="font-bold">Datta</span>pro
                            </h2>
                        </div>

                        {/* MENSAJE DE ÉXITO O ERROR DINÁMICO */}
                        {successMsg && !error && (
                            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                    {successMsg}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-medium animate-in shake duration-300">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </div>
                        )}

                        <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                            Bienvenido
                        </h1>
                        {/*<p className="text-base text-slate-500 dark:text-slate-400">
                            Conéctate con investigadores de todo el mundo y acelera tus descubrimientos.
                        </p>*/}
                    </div>

                    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100" htmlFor="email">
                                    Dirección de correo electrónico
                                </label>
                                <div className="mt-2 text-primary">
                                    <input
                                        autoComplete="email"
                                        className="block w-full rounded-2xl border border-slate-200 py-4 px-4 text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none sm:text-sm bg-white dark:bg-slate-800 transition-all font-medium"
                                        id="email"
                                        name="email"
                                        placeholder="name@institution.edu"
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100" htmlFor="password">
                                        Contraseña
                                    </label>
                                    {/*<div className="text-sm">
                                        <a className="font-semibold text-primary hover:opacity-80 transition-opacity" href="#">
                                            ¿Olvidó su contraseña?
                                        </a>
                                    </div> */}
                                </div>
                                <div className="mt-2 relative">
                                    <input
                                        autoComplete="current-password"
                                        className="block w-full rounded-2xl border border-slate-200 py-4 px-4 text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none sm:text-sm bg-white dark:bg-slate-800 transition-all font-medium"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                                        type="button"
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <button
                                    className="flex w-full justify-center rounded-2xl bg-primary px-3 py-4 text-sm font-bold leading-6 text-white shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Iniciando sesión...
                                        </div>
                                    ) : 'Iniciar sesión'}
                                </button>
                            </div>
                        </form>

                        <p className="mt-10 text-center text-sm text-slate-500">
                            ¿Aún no estas registrado?{' '}
                            <Link
                                to="/register"
                                className="font-semibold leading-6 text-primary hover:opacity-80 transition-opacity"
                            >
                                Crea tu cuenta
                            </Link>
                        </p>
                    </div>

                    <div className="mt-auto pt-10 text-center text-xs text-slate-400">
                        <p className="mb-1">© 2026 dattapro. Colaboración investigativa segura y encriptada.</p>
                        <p>
                            Elaborado por:{' '}
                            <a href="https://github.com/JorgeOrVerMur" className="hover:text-primary transition-colors">Jorge Vera</a>,{' '}
                            <a href="https://wa.me/573014800948" className="hover:text-primary transition-colors">Lorieth Duarte</a> y{' '}
                            <a href="https://wa.me/573105371617" className="hover:text-primary transition-colors">Angel Neira</a>
                        </p>
                    </div>
                </div>

                {/* Right Section: Visual Illustration */}
                <div className="relative hidden w-0 flex-1 lg:block p-8">
                    <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <img
                            alt="Researcher working in a modern high-tech laboratory"
                            className="absolute inset-0 h-full w-full object-cover"
                            src={fotoLogin}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-8 right-8 max-w-lg">
                            <div className="bg-white/10 backdrop-blur-2xl rounded-[1.5rem] p-6 border border-white/20 shadow-2xl">
                                <div className="flex gap-2 mb-4 text-primary">
                                    <img src={logoUnisimon} alt="Logo Unisimón" className="h-16 object-contain" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">El conocimiento de la Unisimón, al servicio de todos</h3>
                                <p className="text-white/80 text-base leading-relaxed mb-4">
                                    Una plataforma que reúne el perfil y la experiencia de nuestro talento para conectarlos con las oportunidades que necesitan su saber.
                                </p>
                                <div className="flex items-center gap-4">
                                    {/* <div className="flex -space-x-3">
                                        {[
                                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
                                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
                                            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
                                        ].map((src, i) => (
                                            <div
                                                key={i}
                                                className="size-12 rounded-full border-2 border-slate-900/20 bg-slate-100 overflow-hidden"
                                            >
                                                <img alt="avatar" className="w-full h-full object-cover" src={src} />
                                            </div>
                                        ))}
                                        <div className="flex size-12 items-center justify-center rounded-full border-2 border-white/20 bg-primary text-xs font-bold text-white shadow-lg">
                                            +12k
                                        </div>
                                    </div>*/}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;