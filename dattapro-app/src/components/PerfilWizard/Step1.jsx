import React from 'react';
import { useFormContext } from 'react-hook-form';

const Step1 = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Autorizaciones y Consentimiento</h2>
      </div>

      <div className="space-y-8">
        {/* Pregunta 1 */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] transition-all hover:border-primary/30">
          <label className="block text-base font-bold text-slate-700 mb-6 leading-relaxed">
            ¿Desea vincularse a la Red Institucional de Investigadores de la Universidad Simón Bolívar?
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex-1 min-w-[120px] relative">
              <input type="radio" value="true" {...register('deseaVincularse', { required: 'Este campo es requerido' })} className="peer sr-only" />
              <div className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex items-center justify-between group">
                <span className="font-bold text-slate-600 peer-checked:text-primary">Sí, deseo vincularme</span>
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 peer-checked:border-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                </div>
              </div>
            </label>
            <label className="flex-1 min-w-[120px] relative">
              <input type="radio" value="false" {...register('deseaVincularse', { required: 'Este campo es requerido' })} className="peer sr-only" />
              <div className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 transition-all flex items-center justify-between group">
                <span className="font-bold text-slate-600 peer-checked:text-primary">No por ahora</span>
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 peer-checked:border-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                </div>
              </div>
            </label>
          </div>
          {errors.deseaVincularse && <span className="text-red-500 text-xs font-bold mt-3 block ml-2">{errors.deseaVincularse.message}</span>}
        </div>
      </div>

      <div className="p-6 bg-sky-50/50 border border-primary/20 rounded-[2rem]">
        <p className="text-sm text-slate-600 leading-relaxed italic">
          <strong>Nota:</strong> Al vincularse a la red, su información profesional podrá ser consultada por otros miembros de la comunidad académica para fomentar la colaboración investigativa.
        </p>
      </div>
    </div>
  );
};

export default Step1;
