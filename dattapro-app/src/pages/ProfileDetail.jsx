import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay sesión activa.');
          setIsLoading(false);
          return;
        }

        const endpoint = id && id !== 'me' ? `${API_BASE_URL}/usuarios/perfil/${id}` : `${API_BASE_URL}/usuarios/perfil/me`;
        const response = await fetch(endpoint, {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('No se pudo obtener el perfil del usuario.');
        }

        const rawData = await response.json();

        // Mapeo idéntico al PerfilWizard.jsx
        const mappedData = {
          nombre: rawData.nombres || '',
          apellidos: rawData.apellidos || '',
          correo: rawData.correoInstitucional || '',
          tipoDocumento: rawData.tipoDocumento || '',
          programa: rawData.programaAcademico || '',
          documento: rawData.numeroIdentificacion || '',
          facultad: rawData.facultad || '',
          tipoVinculacion: rawData.tipoVinculacion || '',
          sede: rawData.sede || '',
          centroInvestigativo: rawData.centroInvestigativo || '',

          formaciones: Array.isArray(rawData.formaciones) && rawData.formaciones.length > 0
            ? rawData.formaciones : [],

          areas: Array.isArray(rawData.areas) && rawData.areas.length > 0
            ? rawData.areas : [],

          idiomas: Array.isArray(rawData.idiomas) && rawData.idiomas.length > 0
            ? rawData.idiomas : [],

          certificaciones: Array.isArray(rawData.certificaciones)
            ? rawData.certificaciones.map(c => typeof c === 'object' ? c.nombre : c) : [],

          aniosProf: rawData.aniosProf ?? rawData.aniosProfesionales ?? null,
          experienciaServicios: rawData.experienciaServicios || '',
          proyectos: Array.isArray(rawData.proyectos) && rawData.proyectos.length > 0
            ? rawData.proyectos.map(p => ({ nombre: p.nombre || p })) : [],
          perfil: rawData.perfilProfesional || '',
          descripcionProyectos: rawData.descripcionProyectos || '',

          competenciasTecnicas: Array.isArray(rawData.competenciasTecnicas) && rawData.competenciasTecnicas.length > 0
            ? rawData.competenciasTecnicas : [],

          competenciasTransversales: Array.isArray(rawData.competenciasTransversales) && rawData.competenciasTransversales.length > 0
            ? rawData.competenciasTransversales : [],

          servicios: Array.isArray(rawData.servicios) && rawData.servicios.length > 0
            ? rawData.servicios : [],

          sectores: Array.isArray(rawData.sectoresExperiencia) && rawData.sectoresExperiencia.length > 0
            ? rawData.sectoresExperiencia : [],

          intereses: Array.isArray(rawData.intereses) && rawData.intereses.length > 0
            ? rawData.intereses : [],

          areasEspecialidad: Array.isArray(rawData.areasEspecialidad) && rawData.areasEspecialidad.length > 0
            ? rawData.areasEspecialidad : [],

          objetivo: rawData.objetivo || '',
          cvlac: rawData.cvlac || '',
          linkedin: rawData.linkedin || '',
          googleScholar: rawData.googleScholar || '',
          otraRed: rawData.otraRed || '',

          colaborativos: rawData.colaborativos === true || rawData.colaborativos === 1,
          liderar: rawData.liderar === true || rawData.liderar === 1,

          foto: rawData.foto || null
        };

        setProfileData(mappedData);
      } catch (error) {
        console.error('Error cargando los datos del perfil:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-900 font-display p-6 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-950 p-12 shadow-xl rounded-[2.5rem] border border-red-100 dark:border-red-900/30 text-center max-w-lg">
          <svg className="mx-auto h-16 w-16 text-red-500 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">No pudimos cargar el perfil</h2>
          <p className="text-slate-500 mb-8">{error || "Usuario no encontrado"}</p>
          <button
            onClick={() => navigate('/network')}
            className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-sky-600 transition-colors shadow-md"
          >
            Volver al Directorio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 font-display py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Botón Volver */}
        <div>
          <button
            onClick={() => navigate('/network')}
            className="flex items-center text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Directorio
          </button>
        </div>

        {/* Cabecera */}
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Foto o Iniciales */}
            <div className="h-32 w-32 md:h-40 md:w-40 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold font-display shadow-lg border-4 border-white dark:border-slate-800 overflow-hidden">
              {profileData.foto ? (
                <img src={`data:image/jpeg;base64,${profileData.foto}`} alt="Foto de perfil" className="h-full w-full object-cover" />
              ) : (
                <span>{profileData.nombre?.charAt(0)}{profileData.apellidos?.charAt(0)}</span>
              )}
            </div>

            {/* Información Principal */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {profileData.nombre} {profileData.apellidos}
              </h1>
              <p className="text-xl font-bold text-primary mt-2 flex items-center justify-center md:justify-start gap-2">
                Profesor e Investigador
                {profileData.centroInvestigativo && profileData.centroInvestigativo !== 'No pertenece' && <span className="text-sm px-3 py-1 bg-sky-100 text-sky-700 rounded-full font-semibold">{profileData.centroInvestigativo}</span>}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                {profileData.correo && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {profileData.correo}
                  </span>
                )}
                {profileData.facultad && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {profileData.facultad}
                  </span>
                )}
                {profileData.programa && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                    {profileData.programa}
                  </span>
                )}
                {profileData.tipoVinculacion && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {profileData.tipoVinculacion}
                  </span>
                )}
                {profileData.sede && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profileData.sede}
                  </span>
                )}
              </div>

              {profileData.perfil && (
                <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">"{profileData.perfil}"</p>
                </div>
              )}

              {/* Redes */}
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                {profileData.linkedin && (
                  <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#0A66C2]/10 text-[#0A66C2] font-bold rounded-xl hover:bg-[#0A66C2] hover:text-white transition-colors text-sm flex items-center">
                    LinkedIn
                  </a>
                )}
                {profileData.googleScholar && (
                  <a href={profileData.googleScholar} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-colors text-sm flex items-center">
                    Google Scholar
                  </a>
                )}
                {profileData.cvlac && (
                  <a href={profileData.cvlac} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 hover:text-white transition-colors text-sm flex items-center">
                    CvLAC
                  </a>
                )}
                {profileData.otraRed && (
                  <a href={profileData.otraRed} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 hover:text-white transition-colors text-sm flex items-center">
                    Website Personal
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          <div className="lg:col-span-3 space-y-8">
            {/* Experiencia */}
            <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center">
                <span className="p-2.5 bg-primary/10 rounded-xl mr-4">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                Experiencia Profesional
              </h3>

              {profileData.experienciaServicios && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Resumen</h4>
                  <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{profileData.experienciaServicios}</p>
                </div>
              )}

              {profileData.proyectos && profileData.proyectos.length > 0 && profileData.proyectos.some(p => p.nombre) && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Tipos de Proyecto</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.proyectos.map((p, i) => p.nombre && (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold border border-violet-100 dark:border-violet-800"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {p.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profileData.descripcionProyectos && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Proyectos Resaltados</h4>
                  <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{profileData.descripcionProyectos}</p>
                </div>
              )}

              {profileData.aniosProf != null && profileData.aniosProf > 0 && (
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 rounded-2xl">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-2xl font-black text-primary">{profileData.aniosProf}</span>
                    <span className="text-sm font-bold text-primary/70">{profileData.aniosProf === 1 ? 'año de experiencia' : 'años de experiencia'}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Servicios que Ofrece</h4>
                  <div className="space-y-3">
                    {profileData.servicios.length > 0 ? profileData.servicios.map((s, i) => s.nombre && (
                      <div key={i} className="flex items-start">
                        <svg className="h-5 w-5 text-primary mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.nombre}</span>
                      </div>
                    )) : <p className="text-sm text-slate-500 font-medium">No se han registrado servicios.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Sectores de Experiencia</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.sectores.length > 0 ? profileData.sectores.map((s, i) => s.nombre && (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                        {s.nombre}
                      </span>
                    )) : <p className="text-sm text-slate-500 font-medium">No registrados.</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Académica */}
            <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center">
                <span className="p-2.5 bg-blue-500/10 rounded-xl mr-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                </span>
                Trayectoria Académica
              </h3>

              <div className="space-y-6">
                {profileData.formaciones.length > 0 ? profileData.formaciones.map((f, i) => f.titulo && (
                  <div key={i} className="flex gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm h-12 w-12 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-base">{f.titulo}</h4>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{f.nivel}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500 font-medium">No se ha registrado formación académica.</p>}
              </div>

              {profileData.certificaciones.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Certificaciones</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.certificaciones.map((c, i) => (
                      <span key={i} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-bold border border-blue-100 dark:border-blue-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Competencias */}
            <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                Competencias
              </h3>

              {/* Leyenda de niveles */}
              <div className="mb-6">
                {/* Fila 1: labels */}
                <div className="grid grid-cols-4 mb-1">
                  {['Básico', 'Medio', 'Avanzado', 'Experto'].map(label => (
                    <span key={label} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide text-center">{label}</span>
                  ))}
                </div>
                {/* Fila 2: barras representativas */}
                <div className="grid grid-cols-4">
                  {[1, 2, 3, 4].map(bars => (
                    <div key={bars} className="flex justify-center items-center gap-0.5">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className={`h-1.5 w-3 rounded-full ${n <= bars ? 'bg-slate-400 dark:bg-slate-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Técnicas</h4>
                  <div className="space-y-3">
                    {profileData.competenciasTecnicas.length > 0 ? profileData.competenciasTecnicas.map((c, i) => c.nombre && (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{c.nombre}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4].map(n => (
                            <div key={n} className={`h-2 w-3 rounded-full ${n <= c.nivel ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                          ))}
                        </div>
                      </div>
                    )) : <p className="text-sm text-slate-500 font-medium">No registradas.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Transversales</h4>
                  <div className="space-y-3">
                    {profileData.competenciasTransversales.length > 0 ? profileData.competenciasTransversales.map((c, i) => c.nombre && (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{c.nombre}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4].map(n => (
                            <div key={n} className={`h-2 w-3 rounded-full ${n <= c.nivel ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                          ))}
                        </div>
                      </div>
                    )) : <p className="text-sm text-slate-500 font-medium">No registradas.</p>}
                  </div>
                </div>

                {profileData.idiomas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Idiomas</h4>
                    <div className="space-y-3">
                      {profileData.idiomas.map((id, i) => id.idioma && (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{id.idioma}</span>
                          <span className="font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-[10px] uppercase">{id.nivel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profileData.areas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Áreas de Conocimiento</h4>
                    <div className="space-y-2">
                      {profileData.areas.map((a, i) => a.nombre && (
                        <div key={i} className="text-xs font-bold text-slate-600 dark:text-slate-400 py-1.5 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          {a.nombre}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Especialidad e Intereses */}
            <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-500">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                Proyección Profesional
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Áreas de Especialidad</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.areasEspecialidad.length > 0 ? profileData.areasEspecialidad.map((a, i) => a.nombre && (
                      <span key={i} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                        {a.nombre}
                      </span>
                    )) : <p className="text-sm text-slate-500 font-medium">No registradas.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Intereses en la red</h4>
                  <div className="space-y-2">
                    {profileData.intereses.length > 0 ? profileData.intereses.map((int, i) => int.nombre && (
                      <div key={i} className="flex items-center text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2.5 flex-shrink-0"></span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{int.nombre}</span>
                      </div>
                    )) : <p className="text-sm text-slate-500 font-medium">No registrados.</p>}
                  </div>
                </div>

                {profileData.objetivo && (
                  <div className="p-5 bg-sky-50 dark:bg-sky-900/10 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                    <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2">Objetivo</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                      "{profileData.objetivo}"
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Proyectos Colaborativos</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      profileData.colaborativos
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {profileData.colaborativos ? '✓ Sí' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Lidera Proyectos</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      profileData.liderar
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {profileData.liderar ? '✓ Sí' : '✗ No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;
