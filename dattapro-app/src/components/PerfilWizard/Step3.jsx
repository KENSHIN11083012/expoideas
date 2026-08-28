import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import CreatableSelect from 'react-select/creatable';
import { API_BASE_URL } from '../../config/api';

const Step3 = () => {
  const { register, control, formState: { errors } } = useFormContext();
  const [apiCertificaciones, setApiCertificaciones] = useState([]);

  // Cargar certificaciones desde la API
  useEffect(() => {
    const fetchCertificaciones = async () => {
      try {
        const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
        console.log("URL de la petición:", `${API_BASE_URL}/certificaciones`);
        const response = await fetch(`${API_BASE_URL}/certificaciones`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + cleanToken
          }
        });
        if (response.ok) {
          const data = await response.json();
          const options = data.map(cert => ({
            value: cert.nombre,
            label: cert.nombre
          }));
          setApiCertificaciones(options);
        }
      } catch (error) {
        console.error("Error cargando certificaciones:", error);
      }
    };
    fetchCertificaciones();
  }, []);

  const { fields: formaciónFields, append: appendFormación, remove: removeFormación } = useFieldArray({
    control,
    name: "formaciones"
  });

  // Field Array para Áreas de Conocimiento
  const { fields: areaFields, append: appendArea, remove: removeArea } = useFieldArray({
    control,
    name: "areas"
  });

  // Field Array para Idiomas
  const { fields: idiomasFields, append: appendIdioma, remove: removeIdioma } = useFieldArray({
    control,
    name: "idiomas"
  });

  // Field Arrays para Servicios y Sectores
  const { fields: serviciosFields, append: appendServicio, remove: removeServicio } = useFieldArray({
    control,
    name: "servicios"
  });

  const { fields: sectoresFields, append: appendSector, remove: removeSector } = useFieldArray({
    control,
    name: "sectores"
  });

  // Field Array para Tipos de Proyecto
  const { fields: proyectosFields, append: appendProyecto, remove: removeProyecto } = useFieldArray({
    control,
    name: "proyectos"
  });

  const areasOpciones = [
    "Agronomía, Veterinaria y afines",
    "Bellas Artes",
    "Ciencias de la Educación",
    "Ciencias de la Salud",
    "Ciencias Sociales y Humanas",
    "Economía, Administración, Contaduría y afines",
    "Ingeniería, Arquitectura, Urbanismo y afines",
    "Matemáticas y Ciencias Naturales"
  ];

  const idiomasOpciones = [
    "Inglés",
    "Español",
    "Francés",
    "Alemán",
    "Italiano",
    "Portugués",
    "Mandarín",
    "Japonés",
    "Otro"
  ];

  const nivelesIdiomaOpciones = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
    "Nativo"
  ];

  const serviciosOpciones = [
    "Consultoría técnica",
    "Asesoría estratégica",
    "Formación / Talleres / Docencia",
    "Mentoría / Coaching",
    "Desarrollo tecnológico",
    "Investigación aplicada",
    "Diagnósticos y estudios",
    "Contenidos digitales",
    "Auditoría",
    "Gestión de proyectos",
    "Comercial / Marketing",
    "Logística / Operaciones",
    "Legal / Normativo"
  ];

  const sectoresOpciones = [
    "Público",
    "Privado",
    "Academia / Investigación",
    "Internacional",
    "Social / Comunitario",
    "ONG / Sin fines de lucro",
    "Cooperativismo / Economía Solidaria"
  ];

  const tiposProyectoOpciones = [
    "Innovación tecnológica",
    "Emprendimiento",
    "Extensión social o comunitaria",
    "Investigación aplicada",
    "Transferencia de conocimiento"
  ];

  // Estilos personalizados para react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '1rem',
      padding: '0.4rem 0.5rem',
      backgroundColor: '#f8fafc', // slate-50
      borderColor: state.isFocused ? '#10b981' : '#e2e8f0', // primary vs slate-200
      boxShadow: state.isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#10b981' : '#cbd5e1',
      },
      transition: 'all 0.2s ease',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#334155'
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '1rem',
      padding: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 100,
      backgroundColor: 'white',
      border: '1px solid #f1f5f9',
      overflow: 'hidden'
    }),
    option: (provided, state) => ({
      ...provided,
      borderRadius: '0.5rem',
      backgroundColor: state.isSelected
        ? '#10b981'
        : state.isFocused
          ? '#ecfdf5'
          : 'white',
      color: state.isSelected ? 'white' : '#475569',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#10b981'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#10b981',
      borderRadius: '0.5rem',
      color: 'white',
      padding: '2px 8px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
      fontWeight: 'bold',
      fontSize: '0.75rem'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontWeight: '500'
    })
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sección Académica */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Trasfondo Académico</h2>
              <p className="text-sm text-slate-500 font-medium leading-none mt-1">Tu formación y conocimientos clave</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => appendFormación({ nivel: '', titulo: '' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-bold text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Agregar formación
          </button>
        </div>

        <div className="space-y-6">
          {formaciónFields.map((field, index) => (
            <div key={field.id} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] relative group animate-in zoom-in-95 duration-300">
              {formaciónFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFormación(index)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nivel de Formación</label>
                  <select
                    {...register(`formaciones.${index}.nivel`, { required: 'El nivel es requerido' })}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none transition-all font-semibold text-slate-700 text-sm"
                  >
                    <option value="">Seleccione nivel...</option>
                    <option value="Pregrado">Pregrado / Profesional</option>
                    <option value="Especialización">Especialización</option>
                    <option value="Maestría">Maestría</option>
                    <option value="Doctorado">Doctorado</option>
                    <option value="Postdoctorado">Postdoctorado</option>
                  </select>
                  {errors.formaciones?.[index]?.nivel && <span className="text-red-500 text-[10px] font-bold uppercase block ml-1">{errors.formaciones[index].nivel.message}</span>}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Título Obtenido</label>
                  <input
                    type="text"
                    placeholder="Ej. Ingeniero Multimedia"
                    {...register(`formaciones.${index}.titulo`, { required: 'El título es requerido' })}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm"
                  />
                  {errors.formaciones?.[index]?.titulo && <span className="text-red-500 text-[10px] font-bold uppercase block ml-1">{errors.formaciones[index].titulo.message}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sección Certificaciones Avanzada */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <div>
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Certificaciones y Logros</label>
            <p className="text-[11px] text-slate-400 font-medium ml-1">Busca, selecciona o escribe tus certificaciones oficiales</p>
          </div>

          <div className="relative">
            <Controller
              name="certificacionesNombres"
              control={control}
              render={({ field }) => {
                const handleCreate = async (inputValue) => {
                  try {
                    const cleanToken = (localStorage.getItem('token') || '').replace(/[\n\r"'\s]/g, '');
                    console.log("URL de la petición:", `${API_BASE_URL}/certificaciones`);

                    const response = await fetch(`${API_BASE_URL}/certificaciones`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + cleanToken
                      },
                      body: JSON.stringify({ nombre: inputValue })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      const newOption = { label: data.nombre, value: data.nombre };
                      setApiCertificaciones(prev => [...prev, newOption]);
                      field.onChange([...(field.value || []), data.nombre]);
                    } else {
                      console.error("Error en el backend al crear la certificación");
                    }
                  } catch (error) {
                    console.error("Error de red intentando crear la certificación:", error);
                  }
                };

                return (
                  <CreatableSelect
                    {...field}
                    isMulti
                    options={apiCertificaciones}
                    placeholder="Escribe para buscar o crear..."
                    classNamePrefix="react-select"
                    styles={customSelectStyles}
                    formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
                    noOptionsMessage={() => "No se encontraron resultados"}
                    value={(field.value || []).map(val => ({ label: val, value: val }))}
                    onChange={(newValue) => {
                      field.onChange(newValue ? newValue.map(opt => opt.value) : []);
                    }}
                    onCreateOption={handleCreate}
                    onBlur={field.onBlur}
                    aria-label="Certificaciones"
                  />
                );
              }}
            />
          </div>
        </div>

        {/* Sección Áreas de Conocimiento */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Áreas de Conocimiento</label>
            <button
              type="button"
              onClick={() => appendArea({ nombre: '' })}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-bold text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar área
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areaFields.map((field, index) => (
              <div key={field.id} className="relative group animate-in slide-in-from-left-2 duration-300">
                <select
                  {...register(`areas.${index}.nombre`, { required: 'El área es requerida' })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 text-sm shadow-sm"
                >
                  <option value="">Seleccione un área...</option>
                  {areasOpciones.map(opcion => (
                    <option key={opcion} value={opcion}>{opcion}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-10 flex items-center px-2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {areaFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArea(index)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {errors.areas?.[index]?.nombre && <span className="text-red-500 text-[10px] font-bold uppercase block mt-1 ml-1">{errors.areas[index].nombre.message}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Sección Idiomas */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Idiomas</label>
            <button
              type="button"
              onClick={() => appendIdioma({ idioma: '', nivel: '' })}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-bold text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar idioma
            </button>
          </div>

          <div className="space-y-4">
            {idiomasFields.map((field, index) => (
              <div key={field.id} className="flex gap-4 relative group animate-in slide-in-from-left-2 duration-300">
                <div className="flex-1 relative">
                  <select
                    {...register(`idiomas.${index}.idioma`, { required: 'El idioma es requerido' })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 text-sm shadow-sm"
                  >
                    <option value="">Seleccione idioma...</option>
                    {idiomasOpciones.map(opcion => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {errors.idiomas?.[index]?.idioma && <span className="text-red-500 text-[10px] font-bold uppercase block mt-1 ml-1">{errors.idiomas[index].idioma.message}</span>}
                </div>

                <div className="w-48 relative">
                  <select
                    {...register(`idiomas.${index}.nivel`, { required: 'El nivel es requerido' })}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 text-sm shadow-sm"
                  >
                    <option value="">Seleccione nivel...</option>
                    {nivelesIdiomaOpciones.map(opcion => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {idiomasFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIdioma(index)}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm p-1 z-10"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {errors.idiomas?.[index]?.nivel && <span className="text-red-500 text-[10px] font-bold uppercase block mt-1 ml-1">{errors.idiomas[index].nivel.message}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Secciones: Servicios y Sectores de Experiencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
        {/* Servicios que Ofrece */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Servicios que Ofrece</label>
            <button type="button" onClick={() => appendServicio({ nombre: '' })} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-bold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Agregar servicio
            </button>
          </div>
          <div className="space-y-3">
            {serviciosFields.map((field, index) => (
              <div key={field.id} className="relative group animate-in slide-in-from-left-2 duration-300">
                <select {...register(`servicios.${index}.nombre`)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none text-xs font-semibold text-slate-700 shadow-sm">
                  <option value="">Seleccione servicio...</option>
                  {serviciosOpciones.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-10 flex items-center px-2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
                {serviciosFields.length > 1 && (
                  <button type="button" onClick={() => removeServicio(index)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 p-1 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sectores de Experiencia */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Sectores de Experiencia</label>
            <button type="button" onClick={() => appendSector({ nombre: '' })} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-bold text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Agregar sector
            </button>
          </div>
          <div className="space-y-3">
            {sectoresFields.map((field, index) => (
              <div key={field.id} className="relative group animate-in slide-in-from-right-2 duration-300">
                <select {...register(`sectores.${index}.nombre`)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none text-xs font-semibold text-slate-700 shadow-sm">
                  <option value="">Seleccione sector...</option>
                  {sectoresOpciones.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-10 flex items-center px-2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
                {sectoresFields.length > 1 && (
                  <button type="button" onClick={() => removeSector(index)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 p-1 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección Experiencia */}
      <section className="space-y-8">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Experiencia Profesional</h2>
            <p className="text-sm text-slate-500 font-medium leading-none mt-1">Trayectoria y logros destacados</p>
          </div>
        </div>

        {/* Formulario de Experiencia Servicios */}
        <div className="space-y-6">
          {/*Años de Experiecia */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Años de Experiencia Profesional</label>
            <input
              type="number"
              placeholder="Ej. 5"
              {...register('aniosProf', {
                required: 'Este campo es requerido',
                valueAsNumber: true,
                min: { value: 0, message: 'Mínimo 0 años' }
              })}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-400 shadow-sm"
            />
            {errors.aniosProf && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.aniosProf.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Resumen de Experiencia</label>
            <textarea
              rows="4"
              placeholder="Describe brevemente tus años de experiencia y roles principales..."
              {...register('experienciaServicios', { required: 'La experiencia es requerida' })}
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 resize-none leading-relaxed shadow-sm"
            ></textarea>
            {errors.experienciaServicios && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.experienciaServicios.message}</span>}
          </div>

          {/* Tipos de Proyecto */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tipos de Proyecto</label>
              <button
                type="button"
                onClick={() => appendProyecto({ nombre: '' })}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all font-bold text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar tipo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proyectosFields.map((field, index) => (
                <div key={field.id} className="relative group animate-in slide-in-from-left-2 duration-300">
                  <select
                    {...register(`proyectos.${index}.nombre`)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 text-sm shadow-sm"
                  >
                    <option value="">Seleccione tipo de proyecto...</option>
                    {tiposProyectoOpciones.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-10 flex items-center px-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {proyectosFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProyecto(index)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors p-1"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Descripción de Proyectos */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción de Proyectos</label>
            <textarea
              rows="4"
              placeholder="Describe los proyectos más relevantes en los que has participado o liderado..."
              {...register('descripcionProyectos', { required: 'La descripción de proyectos es requerida' })}
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 resize-none leading-relaxed shadow-sm"
            ></textarea>
            {errors.descripcionProyectos && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.descripcionProyectos.message}</span>}
          </div>

          {/* Formulario de Experiencia Perfil */}
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Perfil Profesional (Bio)</label>
            <textarea
              rows="4"
              placeholder="Un párrafo introductorio sobre tu enfoque y visión..."
              {...register('perfil', { required: 'El perfil profesional es requerido' })}
              className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400 resize-none leading-relaxed shadow-sm"
            ></textarea>
            {errors.perfil && <span className="text-red-500 text-[11px] font-bold uppercase block ml-1">{errors.perfil.message}</span>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Step3;
