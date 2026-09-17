import React from 'react';
import logoUnisimon from '../assets/brand/logo-unisimon.png';
import logoMacondoLab from '../assets/brand/logo-macondolab.png';

/**
 * Logos de la Universidad Simón Bolívar y MacondoLab, lado a lado con un
 * separador, como en la pieza institucional.
 *
 * El verde y el gris de los logos pierden contraste sobre fondos oscuros: ahi
 * hay que darle fondo blanco con className (`bg-white` sobre la foto del login,
 * `dark:bg-white` sobre tarjetas que cambian con el modo oscuro). No lleva fondo
 * fijo porque sobre una tarjeta blanca con decoracion la taparia con un recuadro.
 *
 * @param {string} [className] clases extra para el contenedor (fondo, margenes, sombra, visibilidad)
 */
const LogosInstitucionales = ({ className = '' }) => (
    <div className={`inline-flex items-center gap-4 sm:gap-5 rounded-2xl px-4 py-3 sm:px-5 ${className}`}>
        <img
            src={logoUnisimon}
            alt="Universidad Simón Bolívar"
            className="h-14 sm:h-16 w-auto object-contain"
        />
        <span className="h-10 sm:h-12 w-px bg-slate-300" aria-hidden="true" />
        <img
            src={logoMacondoLab}
            alt="MacondoLab, Centro de Crecimiento Empresarial e Innovación"
            className="h-14 sm:h-16 w-auto object-contain"
        />
    </div>
);

export default LogosInstitucionales;
