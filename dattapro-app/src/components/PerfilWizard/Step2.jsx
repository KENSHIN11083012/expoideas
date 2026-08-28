import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';

const Step2 = () => {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const fileInputRef = useRef(null);
  const foto = watch('foto');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación de tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten imágenes (JPG, JPEG, PNG)');
      return;
    }

    // Validación de tamaño (3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('El archivo es demasiado grande (Máximo 3MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Guardar el string completo (data:image/...;base64,...) para mantener el tipo MIME
      setValue('foto', reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ... (rest of the component until line 245) ... */}
      {/* Header Sección */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Información Básica</h2>
          <p className="text-sm text-slate-500 font-medium leading-none mt-1">Detalles institucionales y de contacto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
        {/* Nombre Completo */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre Completo</label>
          <div className="relative group">
            <input
              type="text"
              {...register('nombre', {
                required: 'El nombre es requerido',
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Solo se permiten letras' }
              })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-400"
              placeholder="Ej. Juan"
            />
            {errors.nombre && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.nombre.message}</span>}
          </div>
        </div>

        {/* Apellidos */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Apellidos</label>
          <div className="relative group">
            <input
              type="text"
              {...register('apellidos', {
                required: 'Los apellidos son requeridos',
                pattern: { value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, message: 'Solo se permiten letras' }
              })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-400"
              placeholder="Ej. Pérez"
            />
            {errors.apellidos && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.apellidos.message}</span>}
          </div>
        </div>

        {/* Tipo de Documento */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tipo de Documento</label>
          <div className="relative group">
            <select
              {...register('tipoDocumento', { required: 'El tipo de documento es requerido' })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700"
            >
              <option value="">Seleccione tipo...</option>
              <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
              <option value="Cédula de extranjería">Cédula de extranjería</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Permiso Especial de Permanencia (PEP)">Permiso Especial de Permanencia (PEP)</option>
              <option value="Permiso por Protección Temporal (PPT)">Permiso por Protección Temporal (PPT)</option>
              <option value="Otro">Otro</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {errors.tipoDocumento && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.tipoDocumento.message}</span>}
          </div>
        </div>

        {/* Documento Identification */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Documento Identificación</label>
          <div className="relative group">
            <input
              type="text"
              {...register('documento', {
                required: 'El documento es requerido',
                pattern: { value: /^[0-9]+$/, message: 'Solo se permiten números' }
              })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-400"
              placeholder="Ej. 1090123456"
            />
            {errors.documento && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.documento.message}</span>}
          </div>
        </div>

        {/* Correo Principal */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Correo Institucional</label>
          <div className="relative group">
            <input
              type="email"
              readOnly
              {...register('correo', {
                required: 'El correo es requerido',
                pattern: { value: /^\S+@\S+$/i, message: 'Correo inválido' }
              })}
              className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none transition-all font-semibold text-slate-500 cursor-not-allowed opacity-80"
              placeholder="usuario@unisimon.edu.co"
            />
            {errors.correo && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.correo.message}</span>}
          </div>
        </div>

        {/* Sede */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Sede Principal</label>
          <div className="relative group">
            <select
              {...register('sede', { required: 'La sede es requerida' })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 shadow-sm"
            >
              <option value="">Seleccione Sede...</option>
              <option value="Cúcuta">Cúcuta</option>
              <option value="Barranquilla">Barranquilla</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {errors.sede && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.sede.message}</span>}
          </div>
        </div>

        {/* Programa */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Programa Académico</label>
          <div className="relative group">
            <select
              {...register('programa', { required: 'El programa es requerido' })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 shadow-sm"
            >
              <option value="">Seleccione un programa...</option>
              <option value="Administración de Empresas">Administración de Empresas</option>
              <option value="Comercio y Negocios Internacionales">Comercio y Negocios Internacionales</option>
              <option value="Contaduría Pública">Contaduría Pública</option>
              <option value="Marketing y Negocios Digitales">Marketing y Negocios Digitales</option>
              <option value="Derecho">Derecho</option>
              <option value="Psicología">Psicología</option>
              <option value="Trabajo Social">Trabajo Social</option>
              <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
              <option value="Ingeniería Multimedia">Ingeniería Multimedia</option>
              <option value="Ingeniería Industrial">Ingeniería Industrial</option>
              <option value="Ingeniería Mecánica">Ingeniería Mecánica</option>
              <option value="Ingeniería de Datos e Inteligencia Artificial">Ingeniería de Datos e Inteligencia Artificial</option>
              <option value="Matemáticas y Ciencias de la Computación">Matemáticas y Ciencias de la Computación</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {errors.programa && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.programa.message}</span>}
          </div>
        </div>

        {/* Facultad */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Facultad</label>
          <div className="relative group">
            <select
              {...register('facultad', { required: 'La facultad es requerida' })}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 shadow-sm"
            >
              <option value="">Seleccione una facultad...</option>
              <option value="Administración y Negocios">Facultad de Administración y Negocios</option>
              <option value="Ciencias Básicas y Biomédicas">Facultad de Ciencias Básicas y Biomédicas</option>
              <option value="Ciencias Jurídicas y Sociales">Facultad de Ciencias Jurídicas y Sociales</option>
              <option value="Ciencias de la Salud">Facultad de Ciencias de la Salud</option>
              <option value="Ingenierías">Facultad de Ingenierías</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {errors.facultad && <span className="text-red-500 text-[11px] font-bold absolute -bottom-5 left-1 uppercase">{errors.facultad.message}</span>}
          </div>
        </div>

        {/* Centro Investigativo */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider ml-1">Centro Investigativo</label>
          <div className="relative group">
            <select
              {...register('centroInvestigativo')}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none appearance-none transition-all font-semibold text-slate-700 shadow-sm"
            >
              <option value="" disabled hidden>Seleccione un centro investigativo</option>
              <option value="No pertenece">No pertenece</option>
              <option value="Adaptia">Adaptia</option>
              <option value="AudacIA">AudacIA</option>
              <option value="MACONDOLAB">MACONDOLAB</option>
              <option value="CICV">CICV</option>
              <option value="CIISO">CIISO</option>
              <option value="CIEF">CIEF</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tipo de Vinculación */}
      <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800">Tipo de Vinculación</h3>
            <p className="text-xs text-slate-500 font-medium">Define tu relación contractual con la institución</p>
          </div>
          <div className="flex-1 max-w-xs relative group">
            <select
              {...register('tipoVinculacion', { required: 'El tipo de vinculación es requerido' })}
              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none transition-all font-bold text-slate-700 shadow-sm pr-10"
            >
              <option value="">Seleccione...</option>
              <option value="Tiempo Completo">Tiempo Completo</option>
              <option value="Medio Tiempo">Medio Tiempo</option>
              <option value="Planta tiempo completo">Planta tiempo completo</option>
              <option value="Planta medio tiempo">Planta medio tiempo</option>
              <option value="Catedrático">Catedrático</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Foto de Perfil */}
      <div className="mt-12 pt-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              {foto ? (
                <img
                  src={foto.includes('base64,') ? foto : `data:image/jpeg;base64,${foto}`}
                  alt="Vista previa"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="text-slate-300">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            {foto && (
              <button
                type="button"
                onClick={() => setValue('foto', '')}
                className="absolute -top-1 -right-1 p-2 bg-white rounded-full shadow-lg border border-slate-100 text-red-500 hover:text-red-600 transition-colors active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h3 className="text-lg font-black text-slate-800">Foto de Perfil</h3>
              <p className="text-sm text-slate-500 font-medium">Sube una foto profesional para tu perfil (Opcional)</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png"
              className="hidden"
            />

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-6 py-3 bg-[#3db4ed] text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#3db4ed]/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {foto ? 'Cambiar Foto' : 'Subir Foto'}
              </button>

              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest w-full">
                JPG, PNG • Máximo 3MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
