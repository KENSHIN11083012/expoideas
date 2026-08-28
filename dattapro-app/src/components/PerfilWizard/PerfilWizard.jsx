import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';

const PerfilWizard = () => {
  const navigate = useNavigate();
  const { logout, token: authToken, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [submitResult, setSubmitResult] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);


  const methods = useForm({
    defaultValues: {
      nombre: '',
      apellidos: '',
      correo: '',
      tipoDocumento: '',
      programa: '',
      documento: '',
      facultad: '',
      tipoVinculacion: '',
      sede: '',
      centroInvestigativo: '',
      formaciones: [],
      areas: [],
      certificacionesNombres: [],
      aniosProf: 0,
      experienciaServicios: '',
      proyectos: [],
      perfil: '',
      descripcionProyectos: '',
      competenciasTecnicas: [],
      competenciasTransversales: [],
      servicios: [],
      sectores: [],
      intereses: [],
      areasEspecialidad: [],
      objetivo: '',
      cvlac: '',
      linkedin: '',
      googleScholar: '',
      otraRed: '',
      idiomas: [{ idioma: '', nivel: '' }],
      foto: '',
      colaborativos: '0',
      liderar: '0',
      deseaVincularse: 'false',
      autorizaDatos: 'false',
      usuarioId: null
    },
    mode: 'onChange',
  });

  const { reset } = methods;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = authToken || localStorage.getItem('token');
        if (!token) {
          setIsLoadingData(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/usuarios/perfil/me`, {
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const rawData = await response.json();

          // Sincronizar nombre en el contexto global
          if (rawData.nombres) {
            updateUser({
              name: `${rawData.nombres} ${rawData.apellidos || ''}`.trim(),
              email: rawData.correoInstitucional
            });
          }

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
              ? rawData.formaciones
              : [],

            areas: Array.isArray(rawData.areas) && rawData.areas.length > 0
              ? rawData.areas
              : [],

            idiomas: Array.isArray(rawData.idiomas) && rawData.idiomas.length > 0
              ? rawData.idiomas
              : [],

            certificacionesNombres: Array.isArray(rawData.certificaciones)
              ? rawData.certificaciones.map(c => c.nombre || c)
              : [],

            aniosProf: rawData.aniosProf ?? rawData.aniosProfesionales ?? 0,

            experienciaServicios: rawData.experienciaServicios || '',

            proyectos: Array.isArray(rawData.proyectos) && rawData.proyectos.length > 0
              ? rawData.proyectos.map(p => ({ nombre: p.nombre || p }))
              : [],

            perfil: rawData.perfilProfesional || '',

            descripcionProyectos: rawData.descripcionProyectos || '',

            competenciasTecnicas: Array.isArray(rawData.competenciasTecnicas) && rawData.competenciasTecnicas.length > 0
              ? rawData.competenciasTecnicas
              : [],

            competenciasTransversales: Array.isArray(rawData.competenciasTransversales) && rawData.competenciasTransversales.length > 0
              ? rawData.competenciasTransversales
              : [],

            servicios: Array.isArray(rawData.servicios) && rawData.servicios.length > 0
              ? rawData.servicios
              : [],

            sectores: Array.isArray(rawData.sectoresExperiencia) && rawData.sectoresExperiencia.length > 0
              ? rawData.sectoresExperiencia
              : [],

            intereses: Array.isArray(rawData.intereses) && rawData.intereses.length > 0
              ? rawData.intereses
              : [],

            objetivo: rawData.objetivo || '',
            cvlac: rawData.cvlac || '',
            linkedin: rawData.linkedin || '',
            googleScholar: rawData.googleScholar || '',
            otraRed: rawData.otraRed || '',

            areasEspecialidad: Array.isArray(rawData.areasEspecialidad) && rawData.areasEspecialidad.length > 0
              ? rawData.areasEspecialidad
              : [],

            // Convertir booleano → string para que el radio quede seleccionado
            colaborativos: rawData.colaborativos === true || rawData.colaborativos === 1 ? '1' : '0',
            liderar: rawData.liderar === true || rawData.liderar === 1 ? '1' : '0',

            foto: rawData.foto || '',
            deseaVincularse: rawData.deseavincularse === true || rawData.deseavincularse === 'true' ? 'true' : 'false',
            autorizaDatos: rawData.autorizadatos === true || rawData.autorizadatos === 'true' ? 'true' : 'false',
            usuarioId: rawData.id || null
          };


          if (rawData.porcentajeCompletitud !== undefined) {
            setCompletionPercentage(rawData.porcentajeCompletitud);
          }
          reset(mappedData);
        }
      } catch (error) {
        console.error('Error cargando los datos del perfil:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchProfileData();
  }, [reset, authToken]);

  const submitFinal = async (data) => {
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const token = authToken || localStorage.getItem('token');

      // Helper para extraer arrays desde react-hook-form
      const getArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) {
          return val.map(item => typeof item === 'object' ? (item.id || item.value || item.nombre || item) : item).filter(i => i !== null && i !== "");
        }
        return [];
      };

      // Mapeador de textos a IDs numéricos basado en el schema de base de datos
      const mapId = (mapName, val) => {
        if (!val && val !== 0 && val !== '0') return null;
        if (!isNaN(val) && typeof val !== 'boolean') return parseInt(val);
        const maps = {
          // Basic Dropdowns
          tipoDocumento: { "Cédula de ciudadanía": 1, "Cédula de extranjería": 2, "Pasaporte": 3, "Permiso Especial de Permanencia (PEP)": 4, "Permiso por Protección Temporal (PPT)": 5, "Otro": 6 },
          sede: { "Cúcuta": 1, "Barranquilla": 2 },
          facultad: { "Administración y Negocios": 1, "Ciencias Básicas y Biomédicas": 2, "Ciencias Jurídicas y Sociales": 3, "Ciencias de la Salud": 4, "Ingenierías": 5, "Facultad de Administración y Negocios": 1, "Facultad de Ciencias Básicas y Biomédicas": 2, "Facultad de Ciencias Jurídicas y Sociales": 3, "Facultad de Ciencias de la Salud": 4, "Facultad de Ingenierías": 5 },
          programa: { "Administración de Empresas": 1, "Comercio y Negocios Internacionales": 2, "Contaduría Pública": 3, "Marketing y Negocios Digitales": 4, "Derecho": 5, "Psicología": 6, "Trabajo Social": 7, "Ingeniería de Sistemas": 8, "Ingeniería Multimedia": 9, "Ingeniería Industrial": 10, "Ingeniería Mecánica": 11, "Ingeniería de Datos e Inteligencia Artificial": 12, "Matemáticas y Ciencias de la Computación": 13, "Fisioterapia": 14, "Enfermería": 15 },
          centroInvestigativo: { "No pertenece": 1, "Adaptia": 2, "AudacIA": 3, "MACONDOLAB": 4, "CICV": 5, "CIISO": 6, "CIEF": 7 },
          tipoVinculacion: { "Tiempo Completo": 1, "Medio Tiempo": 2, "Planta tiempo completo": 3, "Planta medio tiempo": 4, "Catedrático": 5 },
          nivelFormacion: { "Pregrado": 1, "Especialización": 2, "Maestría": 3, "Doctorado": 4, "Postdoctorado": 5 },

          // Arrays mappings
          areasConocimiento: { "Agronomía, Veterinaria y afines": 1, "Bellas Artes": 2, "Ciencias de la Educación": 3, "Ciencias de la Salud": 4, "Ciencias Sociales y Humanas": 5, "Economía, Administración, Contaduría y afines": 6, "Ingeniería, Arquitectura, Urbanismo y afines": 7, "Matemáticas y Ciencias Naturales": 8 },
          areasEspecialidad: { "Educación": 1, "Salud": 2, "Industria": 3, "TIC / Software": 4, "Emprendimiento": 5, "Finanzas / Contabilidad": 6, "Derecho / Normativo": 7, "Energía / Sostenibilidad": 8, "Agroindustria": 9, "Economía popular y comunitaria": 10, "Logística y comercio": 11 },
          tiposProyecto: { "Innovación tecnológica": 1, "Emprendimiento": 2, "Extensión social o comunitaria": 3, "Investigación aplicada": 4, "Transferencia de conocimiento": 5 },
          servicios: { "Consultoría técnica": 1, "Asesoría estratégica": 2, "Formación / Talleres / Docencia": 3, "Mentoría / Coaching": 4, "Desarrollo tecnológico": 5, "Investigación aplicada": 6, "Diagnósticos y estudios": 7, "Contenidos digitales": 8, "Auditoría": 9, "Gestión de proyectos": 10, "Comercial / Marketing": 11, "Logística / Operaciones": 12, "Legal / Normativo": 13 },
          sectores: { "Público": 1, "Privado": 2, "Academia / Investigación": 3, "Internacional": 4, "Social / Comunitario": 5, "ONG / Sin fines de lucro": 6, "Cooperativismo / Economía Solidaria": 7 },
          intereses: { "Ofertas comerciales para empresas": 1, "Formular y ejecutar proyectos I+D+i": 2, "Realizar mentorías": 3, "Desarrollar capacitaciones": 4, "Consultoría": 5, "Transferencia tecnológica": 6 },

          competenciasTecnicas: { "Gestión de proyectos": 1, "Análisis de datos": 2, "Marketing digital": 3, "Desarrollo tecnológico": 4, "Propiedad intelectual": 5, "Power BI / SPSS / Data Tools": 6 },
          competenciasTransversales: { "Comunicación efectiva": 1, "Trabajo colaborativo": 2, "Adaptabilidad": 3, "Liderazgo": 4, "Orientación a resultados": 5 },

          idiomas: { "Inglés": 1, "Español": 2, "Francés": 3, "Alemán": 4, "Italiano": 5, "Portugués": 6, "Mandarín": 7, "Japonés": 8, "Otro": 9 },
          nivelesIdioma: { "A1": 0, "A2": 1, "B1": 3, "B2": 4, "C1": 5, "C2": 6, "Nativo": 7 }
        };
        const mapped = maps[mapName]?.[String(val).trim()];
        return typeof mapped !== 'undefined' ? mapped : null;
      };

      const mapArrayIds = (mapName, arr) => {
        const rawArray = getArray(arr);
        return rawArray.map(item => mapId(mapName, item)).filter(i => i !== null);
      };

      const formattedData = {
        usuarioId: data.usuarioId,
        datosBasicos: {
          nombre: data.nombre,
          apellidos: data.apellidos,
          deseavincularse: data.deseaVincularse === 'true' || data.deseaVincularse === true,
          autorizadatos: data.autorizaDatos === 'true' || data.autorizaDatos === true,
          tipoDocumentoId: mapId('tipoDocumento', data.tipoDocumento),
          numeroIdentificacion: data.documento || null,
          correo: data.correo || null,
          facultadId: mapId('facultad', data.facultad),
          programaId: mapId('programa', data.programa),
          tipoVinculacionId: mapId('tipoVinculacion', data.tipoVinculacion),
          sedeId: mapId('sede', data.sede),
          centroInvestigativo: mapId('centroInvestigativo', data.centroInvestigativo || 'No pertenece'),
          foto: data.foto ? (data.foto.includes('base64,') ? data.foto.split('base64,')[1] : data.foto) : null
        },

        perfilAcademico: {
          nivelFormacionId: mapId('nivelFormacion', data.formaciones?.[0]?.nivel),
          tituloFormacion: data.formaciones?.[0]?.titulo || null,
          areasIds: mapArrayIds('areasConocimiento', data.areas),
          idiomas: (data.idiomas || [])
            .map(i => ({
              idiomaId: mapId('idiomas', typeof i === 'object' ? i.idioma : null),
              nivelId: mapId('nivelesIdioma', typeof i === 'object' ? i.nivel : null)
            }))
            .filter(i => i.idiomaId !== null && i.nivelId !== null),
          certificacionesNombres: getArray(data.certificacionesNombres)
        },

        experiencia: {
          aniosProf: parseInt(data.aniosProf) || 0,
          tiposProyectoIds: mapArrayIds('tiposProyecto', data.proyectos),
          descripcionProyectos: data.descripcionProyectos || '',
          perfilProfesional: data.perfil || data.perfilProfesional || ''
        },

        competencias: {
          tecnicas: (Array.isArray(data.competenciasTecnicas) ? data.competenciasTecnicas : [])
            .map(c => ({
              competenciaId: mapId('competenciasTecnicas', typeof c === 'object' ? (c.id || c.nombre) : c),
              nivel: typeof c === 'object' && c.nivel ? parseInt(c.nivel) : 1
            }))
            .filter(c => c.competenciaId !== null),
          transversales: (Array.isArray(data.competenciasTransversales) ? data.competenciasTransversales : [])
            .map(c => ({
              competenciaId: mapId('competenciasTransversales', typeof c === 'object' ? (c.id || c.nombre) : c),
              nivel: typeof c === 'object' && c.nivel ? parseInt(c.nivel) : 1
            }))
            .filter(c => c.competenciaId !== null)
        },

        redes: {
          linkedin: data.linkedin || '',
          cvlac: data.cvlac || '',
          googleScholar: data.googleScholar || '',
          otraRed: data.otraRed || ''
        },

        areasEspecialidad: (data.areasEspecialidad || []).filter(a => a.nombre),

        intereses: {
          serviciosIds: mapArrayIds('servicios', data.servicios),
          experienciaServicios: data.experienciaServicios || '',
          sectoresIds: mapArrayIds('sectores', data.sectores),
          quiereParticipar: parseInt(data.colaborativos) === 1,
          quiereLiderar: parseInt(data.liderar) === 1,
          interesesIds: mapArrayIds('intereses', data.intereses),
          objetivo: data.objetivo || ''
        }
      };

      //imprimir el payload que sale al backend
      console.log("🚀 PAYLOAD QUE SALE AL BACKEND:");
      console.log(JSON.stringify(formattedData, null, 2));

      const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) throw new Error('Error al enviar los datos');

      // Manejar respuesta dinámica (JSON o Texto)
      const contentType = response.headers.get("content-type");
      let updatedData = {};
      
      if (contentType && contentType.includes("application/json")) {
        updatedData = await response.json();
        console.log("✅ RESPUESTA JSON DEL SERVIDOR:", updatedData);
      } else {
        const textData = await response.text();
        console.log("📝 RESPUESTA TEXTO DEL SERVIDOR:", textData);
      }

      // Actualizar progreso si viene en la respuesta
      if (updatedData.porcentajeCompletitud !== undefined) {
        setCompletionPercentage(updatedData.porcentajeCompletitud);
      }

      setSubmitResult({ success: true, message: 'Perfil actualizado exitosamente.' });
    } catch (error) {
      console.error("❌ ERROR EN SUBMIT:", error);
      setSubmitResult({ success: false, message: error.message || 'Ocurrió un error al guardar cambios.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 1, label: 'Datos Generales', title: 'Paso 1', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    },
    {
      id: 2, label: 'Experiencia', title: 'Paso 2', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      )
    },
    {
      id: 3, label: 'Redes e Intereses', title: 'Paso 3', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 11-5.656 5.656l-1.102-1.101" /></svg>
      )
    }
  ];

  console.log("Estado de éxito:", submitResult);

  return (
    <>
      {submitResult?.success ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 min-h-[70vh]">
          <div className="max-w-xl w-full bg-white dark:bg-slate-950 p-12 shadow-2xl shadow-slate-200/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-500">
            <div className="mx-auto flex items-center justify-center h-28 w-28 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-8">
              <svg className="h-14 w-14 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">¡Perfil Actualizado!</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 font-medium">
              {submitResult.message}
            </p>

            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-[#1f4571] active:scale-[0.98] transition-all shadow-xl shadow-sky-500/30 text-lg"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col max-w-5xl mx-auto gap-8 pt-4">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Editar Perfil</h1>
              <p className="text-lg font-medium text-slate-500 leading-relaxed">
                Gestiona tu identidad profesional y tus credenciales en toda la red de datos.
              </p>
            </div>

            {/* Wizard Progress - Horizontal Top Bar */}
            <div>
              <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 flex overflow-x-auto">
                {steps.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap min-w-fit ${step === s.id
                      ? 'bg-primary text-white shadow-lg shadow-sky-500/30'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400'
                      }`}
                  >
                    <div className={`${step === s.id ? 'text-white' : 'text-slate-400'}`}>
                      {s.icon}
                    </div>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN FORM AREA */}
            <div className="flex-1">

              {isLoadingData ? (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-24 flex flex-col items-center justify-center space-y-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div>
                  <p className="text-xl text-slate-500 font-bold">Cargando información del perfil...</p>
                </div>
              ) : (
                <FormProvider {...methods}>
                  <form onSubmit={methods.handleSubmit(submitFinal, (errors) => console.log("❌ Errores de validación:", errors))}>
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden mb-12">
                      <div className="p-8 md:p-12 min-h-[400px]">
                        {step === 1 && <Step2 />}
                        {step === 2 && <Step3 />}
                        {step === 3 && <Step4 />}
                      </div>
                    </div>

                    {/* Error Banner */}
                    {submitResult?.success === false && (
                      <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-700 font-bold">{submitResult.message}</p>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end space-x-6">
                      <button type="button" onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-slate-900 transition-colors">
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-10 py-4 bg-sky-500 text-white font-black rounded-2xl hover:bg-sky-600 active:scale-95 transition-all shadow-xl shadow-sky-500/30 disabled:opacity-50 text-lg"
                      >
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                      </button>
                    </div>
                  </form>
                </FormProvider>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerfilWizard;
