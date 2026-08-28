import React, { useState, useEffect } from 'react';
import { Search, Map, UserPlus, GraduationCap, Megaphone, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const Inicio = () => {
  const [stats, setStats] = useState({ profiles: '...', convocatorias: '...' });
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [recentConvocatorias, setRecentConvocatorias] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
        
        // Fetch usuarios
        let profilesCount = '...';
        try {
          const resUsuarios = await fetch(`${API_BASE_URL}/usuarios`, {
            headers: { 'Authorization': 'Bearer ' + cleanToken }
          });
          if (resUsuarios.ok) {
            const dataUsuarios = await resUsuarios.json();
            profilesCount = dataUsuarios.length;
            
            // Últimos 3 usuarios con el ID más alto
            const sorted = [...dataUsuarios].sort((a, b) => b.id - a.id).slice(0, 3);
            setRecentProfiles(sorted);
          }
        } catch (e) {
          console.error('Error fetching users for stats:', e);
        }

        // Fetch convocatorias
        let convocatoriasCount = '...';
        try {
          const resConvocatorias = await fetch(`${API_BASE_URL}/convocatorias`);
          if (resConvocatorias.ok) {
            const dataConvocatorias = await resConvocatorias.json();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const abiertas = dataConvocatorias.filter(c => {
                if (c.visible === false) return false;
                const dateLimite = new Date(c.fechaLimite);
                dateLimite.setHours(0, 0, 0, 0);
                if (c.fechaInicio) {
                    const dateInicio = new Date(c.fechaInicio);
                    dateInicio.setHours(0, 0, 0, 0);
                    return (today >= dateInicio && today <= dateLimite);
                }
                return today <= dateLimite;
            });
            convocatoriasCount = abiertas.length;
            
            const sortedConvocatorias = [...abiertas].sort((a, b) => b.id - a.id).slice(0, 2);
            setRecentConvocatorias(sortedConvocatorias);
          }
        } catch (e) {
          console.error('Error fetching convocatorias for stats:', e);
        }

        setStats({ profiles: profilesCount, convocatorias: convocatoriasCount });
      } catch (err) {
        console.error('General error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 pb-12 font-sans transition-colors duration-200">
      {/* Header section */}
      <div className="relative bg-[#002f5b] text-white pt-10 pb-24 px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('/bg-inicio.png')] bg-cover bg-center mix-blend-screen pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Hola,</h1>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Bienvenido a Dattapro</h2>
            <p className="text-lg md:text-xl text-blue-100 max-w-md leading-relaxed">
              Conectando talento, investigación e innovación
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 relative -mt-12 z-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 flex items-center gap-6 border-b-4 border-[#002f5b] dark:border-blue-500 transition-colors">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-full">
               <GraduationCap className="w-10 h-10 text-[#002f5b] dark:text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.profiles}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Perfiles Registrados</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 flex items-center gap-6 border-b-4 border-yellow-400 dark:border-yellow-500 transition-colors">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-full">
               <Megaphone className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800 dark:text-white">{stats.convocatorias}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Convocatorias Abiertas</div>
            </div>
          </div>
        </div>

        {/* Acceso rápido */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-[#002f5b] dark:text-blue-400 mb-4 transition-colors">Acceso rápido</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <Link to="/network" className="bg-[#0f4d8a] hover:bg-[#0c4073] dark:bg-blue-900 dark:hover:bg-blue-800 transition-all rounded-[1.25rem] px-4 flex items-center shadow-sm h-28 hover:shadow-md group">
              <div className="w-1/2 flex justify-center pr-2">
                <Search className="w-16 h-16 opacity-90 group-hover:scale-105 transition-transform" strokeWidth={1.2} />
              </div>
              <div className="w-1/2 text-left pl-2">
                <span className="font-medium text-[1.1rem] leading-tight block">Buscar Talento</span>
              </div>
            </Link>
            <Link to="/convocatorias" className="bg-[#2a9497] hover:bg-[#247e80] dark:bg-teal-900 dark:hover:bg-teal-800 transition-all rounded-[1.25rem] px-4 flex items-center shadow-sm h-28 hover:shadow-md group">
              <div className="w-1/2 flex justify-center pr-2">
                <Map className="w-16 h-16 opacity-90 group-hover:scale-105 transition-transform" strokeWidth={1.2} />
              </div>
              <div className="w-1/2 text-left pl-2">
                <span className="font-medium text-[1.1rem] leading-tight block">Explorar<br/>Convocatorias</span>
              </div>
            </Link>
            <Link to="/perfil" className="bg-[#2ea4ae] hover:bg-[#268a92] dark:bg-cyan-900 dark:hover:bg-cyan-800 transition-all rounded-[1.25rem] px-4 flex items-center shadow-sm h-28 hover:shadow-md group">
              <div className="w-1/2 flex justify-center pr-2">
                <UserPlus className="w-16 h-16 opacity-90 group-hover:scale-105 transition-transform" strokeWidth={1.2} />
              </div>
              <div className="w-1/2 text-left pl-2">
                <span className="font-medium text-[1.1rem] leading-tight block">Crear Perfil</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Últimos Perfiles & Nuevas Convocatorias */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-[#002f5b] dark:text-blue-400 mb-4 transition-colors">Últimos Perfiles Registrados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProfiles.map((usuario) => (
              <Link to={`/perfil/ver/${usuario.id}`} key={usuario.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#002f5b] to-[#004e8a] dark:from-blue-700 dark:to-blue-900 flex items-center justify-center text-white text-lg font-bold shadow-inner overflow-hidden flex-shrink-0">
                    {usuario.foto ? (
                        <img
                            src={`data:image/jpeg;base64,${usuario.foto}`}
                            alt="Foto"
                            className="h-full w-full object-cover rounded-full"
                        />
                    ) : (
                        <span>{usuario.nombres?.charAt(0)}{usuario.apellidos?.charAt(0)}</span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{usuario.nombres} {usuario.apellidos}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">Investigador / Profesor</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold text-[#002f5b] dark:text-blue-400 mb-4 transition-colors">Nuevas Convocatorias</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentConvocatorias.map((convocatoria) => (
              <Link to={`/convocatorias/detalles/${convocatoria.id}`} key={convocatoria.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-[#002f5b] dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary dark:group-hover:text-blue-400 transition-colors" title={convocatoria.titulo}>{convocatoria.titulo}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{convocatoria.fechaLimite}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Inicio;
